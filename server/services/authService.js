const bcrypt = require('bcryptjs');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const ServiceCategory = require('../models/ServiceCategory');
const PasswordResetToken = require('../models/PasswordResetToken');
const ApiError = require('../utils/ApiError');
const {
  ROLES,
  ACCOUNT_STATUS,
  APPROVAL_STATUS,
  WEEK_DAYS,
} = require('../utils/constants');
const { publicUser, publicWorkerProfile } = require('../utils/serializers');
const { generateSecureToken, hashToken } = require('../utils/generators');
const { createNotification, notifyAdmins } = require('./notificationService');
const { NOTIFICATION_TYPES } = require('../utils/constants');
const config = require('../config/env');

const SALT_ROUNDS = 12;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((v) => v.trim()).filter(Boolean);
  } catch {
    /* fall through to comma parsing */
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

async function loadWorkerBundle(userId) {
  const user = await User.findById(userId);
  const profile = await WorkerProfile.findOne({ userId })
    .populate('serviceCategoryId')
    .populate('additionalServices');
  return { user: publicUser(user), workerProfile: publicWorkerProfile(profile) };
}

async function registerCustomer(data) {
  const email = normalizeEmail(data.email);
  const existing = await User.exists({ email });
  if (existing) throw ApiError.conflict('An account with this email address already exists');

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.create({
    name: data.name.trim(),
    email,
    phone: data.phone.trim(),
    passwordHash,
    role: ROLES.CUSTOMER,
    city: (data.city || '').trim(),
    locality: (data.locality || '').trim(),
  });

  return { user: publicUser(user), workerProfile: null };
}

async function registerWorker(data, file) {
  const email = normalizeEmail(data.email);
  const existing = await User.exists({ email });
  if (existing) throw ApiError.conflict('An account with this email address already exists');

  const primaryCategory = await ServiceCategory.findById(data.profession);
  if (!primaryCategory || !primaryCategory.isActive) {
    throw ApiError.badRequest('Please choose a valid active service category');
  }

  const additionalIds = parseList(data.additionalServices).filter(
    (id) => id && id !== String(primaryCategory._id)
  );
  let additionalCategories = [];
  if (additionalIds.length) {
    additionalCategories = await ServiceCategory.find({
      _id: { $in: additionalIds },
      isActive: true,
    }).select('_id');
    if (additionalCategories.length !== additionalIds.length) {
      throw ApiError.badRequest('One or more additional services are invalid or inactive');
    }
  }

  const days = parseList(data.availabilityDays)
    .map((day) => day.toLowerCase())
    .filter((day) => WEEK_DAYS.includes(day));
  if (!days.length) days.push('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

  const startTime = data.workingHoursStart || '09:00';
  const endTime = data.workingHoursEnd || '18:00';
  if (startTime >= endTime) {
    throw ApiError.badRequest('Working hours end time must be after the start time');
  }

  const serviceAreas = parseList(data.serviceAreas);
  if (!serviceAreas.length) {
    serviceAreas.push(data.locality.trim());
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  let user;
  try {
    user = await User.create({
      name: data.name.trim(),
      email,
      phone: data.phone.trim(),
      passwordHash,
      role: ROLES.WORKER,
      city: data.city.trim(),
      locality: data.locality.trim(),
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    });

    const profile = await WorkerProfile.create({
      userId: user._id,
      serviceCategoryId: primaryCategory._id,
      additionalServices: additionalCategories.map((c) => c._id),
      experienceYears: Number(data.experienceYears || 0),
      description: (data.description || '').trim(),
      profileImage: file ? `/uploads/${file.filename}` : '',
      city: data.city.trim(),
      locality: data.locality.trim(),
      serviceAreas: serviceAreas.slice(0, 12),
      serviceCharge: Number(data.serviceCharge || 0),
      availability: {
        days,
        startTime,
        endTime,
        isAvailable: true,
      },
      approvalStatus: APPROVAL_STATUS.PENDING,
    });

    await createNotification({
      recipientId: user._id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Application received',
      message:
        'Your professional application is under review. You will be notified as soon as an administrator reviews it.',
      actionUrl: '/worker/profile',
    });

    await notifyAdmins({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'New worker application',
      message: `${user.name} applied as ${primaryCategory.name} in ${user.city}. Review the application in Worker Management.`,
      actionUrl: '/admin/workers?approvalStatus=pending',
    });

    const populatedProfile = await WorkerProfile.findById(profile._id)
      .populate('serviceCategoryId')
      .populate('additionalServices');

    return {
      user: publicUser(user),
      workerProfile: publicWorkerProfile(populatedProfile),
      pending: true,
    };
  } catch (error) {
    if (user && !(await WorkerProfile.exists({ userId: user._id }))) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
    }
    throw error;
  }
}

async function login({ email, password, expectedRole }) {
  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    '+passwordHash +tokenVersion'
  );
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const matches = await bcrypt.compare(String(password), user.passwordHash);
  if (!matches) throw ApiError.unauthorized('Invalid email or password');

  if (user.role !== expectedRole) {
    throw ApiError.forbidden(
      'These credentials cannot be used on this login portal. Please use the correct account portal.'
    );
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(
      403,
      user.suspensionReason
        ? `This account is suspended: ${user.suspensionReason}`
        : 'This account has been suspended. Please contact support.',
      'ACCOUNT_SUSPENDED'
    );
  }

  if (user.role === ROLES.WORKER) {
    const profile = await WorkerProfile.findOne({ userId: user._id });
    if (!profile) throw ApiError.forbidden('Worker profile is missing. Please contact support.');
    if (profile.approvalStatus === APPROVAL_STATUS.REJECTED) {
      throw new ApiError(
        403,
        'Your worker application was not approved. Please contact support for more information.',
        'APPLICATION_REJECTED'
      );
    }
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return { user: publicUser(user), tokenVersion: user.tokenVersion || 0, role: user.role };
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  const response = {
    message: 'If an account exists for that email, a password reset link has been created.',
  };

  if (!user || user.role === ROLES.ADMIN) {
    // Admin password recovery is intentionally handled by the secure CLI script.
    return response;
  }

  await PasswordResetToken.deleteMany({ userId: user._id });
  const rawToken = generateSecureToken();
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const resetUrl = `${config.clientUrl}/reset-password?token=${rawToken}`;

  // Email delivery is not configured in this local build. In development the link
  // is returned so the flow can be completed locally. In production, integrate an
  // email provider here and never return the token to the browser.
  if (!config.isProduction) {
    response.devResetUrl = resetUrl;
    console.log(`[dev] Password reset link for ${user.email}: ${resetUrl}`);
  }

  return response;
}

async function resetPassword(rawToken, newPassword) {
  if (!rawToken) throw ApiError.badRequest('Reset token is required');
  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(rawToken),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record) throw ApiError.badRequest('This reset link is invalid or has expired');

  const user = await User.findById(record.userId).select('+tokenVersion');
  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  record.usedAt = new Date();
  await record.save();
  await PasswordResetToken.deleteMany({ userId: user._id, _id: { $ne: record._id } });

  return { message: 'Your password has been reset. You can log in with your new password.' };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash +tokenVersion');
  if (!user) throw ApiError.unauthorized();
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  return user;
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();
  const result = { user: publicUser(user), workerProfile: null };
  if (user.role === ROLES.WORKER) {
    const profile = await WorkerProfile.findOne({ userId })
      .populate('serviceCategoryId')
      .populate('additionalServices');
    result.workerProfile = publicWorkerProfile(profile);
  }
  return result;
}

module.exports = {
  registerCustomer,
  registerWorker,
  login,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getMe,
  loadWorkerBundle,
  normalizeEmail,
};
