const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Render injects RENDER_EXTERNAL_URL for web services, so the public origin is
// known without hard-coding it. CLIENT_URL stays supported for custom domains.
const renderExternalUrl = (process.env.RENDER_EXTERNAL_URL || '').trim();
const clientUrlSetting = (process.env.CLIENT_URL || renderExternalUrl || 'http://localhost:5173').trim();

const required = ['MONGODB_URI', 'JWT_SECRET'];
if (!process.env.CLIENT_URL && !renderExternalUrl) required.push('CLIENT_URL');
const missing = required.filter((key) => !process.env[key]);

if (missing.length && process.env.NODE_ENV === 'production') {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workconnect',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h',
  clientUrl: clientUrlSetting,
  clientUrls: clientUrlSetting
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES || 2 * 1024 * 1024),
  adminName: process.env.ADMIN_NAME || 'Platform Administrator',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
};
