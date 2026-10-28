const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const ServiceCategory = require('../models/ServiceCategory');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const AdminAuditLog = require('../models/AdminAuditLog');
const PasswordResetToken = require('../models/PasswordResetToken');
const { ROLES, ACCOUNT_STATUS } = require('../utils/constants');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const categories = [
  { name: 'Electrician', description: 'Wiring, lighting, switches, sockets and electrical repairs.', icon: 'Zap', sortOrder: 1 },
  { name: 'Plumber', description: 'Leaks, taps, pipes, drains and water system repairs.', icon: 'Droplets', sortOrder: 2 },
  { name: 'Carpenter', description: 'Furniture, doors, shelving, cabinets and woodwork.', icon: 'Hammer', sortOrder: 3 },
  { name: 'Painter', description: 'Interior and exterior painting, touch-ups and finishing.', icon: 'Paintbrush', sortOrder: 4 },
  { name: 'AC Technician', description: 'Air conditioner installation, servicing and repair.', icon: 'AirVent', sortOrder: 5 },
  { name: 'Home Cleaning', description: 'Deep cleaning, regular home cleaning and move-out cleaning.', icon: 'Sparkles', sortOrder: 6 },
  { name: 'Appliance Repair', description: 'Repairs for washing machines, fridges, ovens and more.', icon: 'WashingMachine', sortOrder: 7 },
  { name: 'Mechanic', description: 'Vehicle diagnostics, servicing and on-site repairs.', icon: 'Car', sortOrder: 8 },
  { name: 'Pest Control', description: 'Safe treatment for insects, rodents and other pests.', icon: 'Bug', sortOrder: 9 },
  { name: 'Other Services', description: 'Other trusted local services requested by the community.', icon: 'Wrench', sortOrder: 10 },
];

function generatePassword() {
  return crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
}

async function main() {
  await connectDB();

  await Promise.all([
    User.createIndexes(),
    ServiceCategory.createIndexes(),
    WorkerProfile.createIndexes(),
    Booking.createIndexes(),
    Notification.createIndexes(),
    Review.createIndexes(),
    AdminAuditLog.createIndexes(),
    PasswordResetToken.createIndexes(),
  ]);

  for (const item of categories) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const existing = await ServiceCategory.findOne({ slug });
    if (existing) {
      if (!existing.description) {
        existing.description = item.description;
        existing.icon = existing.icon || item.icon;
        await existing.save();
      }
    } else {
      await ServiceCategory.create({ ...item, slug });
      console.log(`Created category: ${item.name}`);
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  let adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminName = process.env.ADMIN_NAME || 'Platform Administrator';

  if (adminEmail) {
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      if (existing.role !== ROLES.ADMIN) {
        console.error(`The account ${adminEmail} exists but is not an admin. Choose another ADMIN_EMAIL.`);
      } else {
        console.log(`Admin account already exists: ${adminEmail}`);
      }
    } else {
      if (!adminPassword || adminPassword.includes('replace_with') || adminPassword.length < 8) {
        adminPassword = generatePassword();
        console.log('ADMIN_PASSWORD was missing or weak, so a strong temporary password was generated.');
        console.log(`Temporary admin password (save it now): ${adminPassword}`);
      }
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: adminName,
        email: adminEmail,
        phone: '0000000000',
        passwordHash,
        role: ROLES.ADMIN,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      });
      console.log(`Created initial administrator: ${adminEmail}`);
    }
  } else {
    console.log('No ADMIN_EMAIL found. Run `npm run create-admin` to create an administrator securely.');
  }

  console.log('Seed complete. Service categories and database indexes are ready.');
  await disconnectDB();
  await mongoose.connection.close().catch(() => {});
}

main().catch(async (error) => {
  console.error('Seed failed:', error);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
