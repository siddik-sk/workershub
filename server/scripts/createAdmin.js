const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { ROLES, ACCOUNT_STATUS } = require('../utils/constants');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { update: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--update') result.update = true;
    if (args[i] === '--email') result.email = args[i + 1];
    if (args[i] === '--name') result.name = args[i + 1];
  }
  return result;
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptHidden(label) {
  if (!process.stdin.isTTY) return prompt(label);
  return new Promise((resolve) => {
    process.stdout.write(label);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    function cleanup() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    }
    function onData(char) {
      if (char === '\r' || char === '\n' || char === '\u0004') {
        cleanup();
        process.stdout.write('\n');
        resolve(value);
      } else if (char === '\u0003') {
        cleanup();
        process.stdout.write('\n');
        process.exit(1);
      } else if (char === '\u007f' || char === '\b') {
        if (value.length) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        value += char;
        process.stdout.write('*');
      }
    }
    stdin.on('data', onData);
  });
}

function validatePassword(password) {
  if (!password || password.length < 12) return 'Password must be at least 12 characters long.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  if (password.includes('replace_with')) return 'Do not use the example placeholder password.';
  return null;
}

async function main() {
  const args = parseArgs();
  await connectDB();

  const email = (args.email || process.env.ADMIN_EMAIL || (await prompt('Admin email: ')))
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address');
  const name = (args.name || process.env.ADMIN_NAME || (await prompt('Admin full name: '))).trim();
  if (name.length < 2) throw new Error('Admin name must be at least 2 characters');

  const existing = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  if (existing && existing.role !== ROLES.ADMIN) {
    throw new Error('That email is already used by a non-admin account. Choose a different email.');
  }
  if (existing && !args.update) {
    console.log(`An administrator with ${email} already exists. Use --update to set a new password.`);
    await disconnectDB();
    return;
  }

  const password = await promptHidden('Admin password (hidden): ');
  const problem = validatePassword(password);
  if (problem) throw new Error(problem);

  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    existing.role = ROLES.ADMIN;
    existing.accountStatus = ACCOUNT_STATUS.ACTIVE;
    existing.tokenVersion = (existing.tokenVersion || 0) + 1;
    existing.suspensionReason = '';
    await existing.save();
    console.log(`Updated administrator account: ${email}`);
  } else {
    await User.create({
      name,
      email,
      phone: '0000000000',
      passwordHash,
      role: ROLES.ADMIN,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });
    console.log(`Created administrator account: ${email}`);
  }

  await disconnectDB();
  await mongoose.connection.close().catch(() => {});
}

main().catch(async (error) => {
  console.error('Admin setup failed:', error.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
