const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAuthToken, extractToken } = require('../utils/tokens');
const { ACCOUNT_STATUS, ROLES } = require('../utils/constants');

async function resolveUserFromToken(token) {
  if (!token) return null;
  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if ((user.tokenVersion || 0) !== (payload.tv || 0)) {
    throw ApiError.unauthorized('Your session is no longer valid. Please log in again.');
  }
  if (user.role !== payload.role) {
    throw ApiError.unauthorized('Your session role is invalid. Please log in again.');
  }
  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, 'This account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
  }
  return user;
}

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Please log in to continue');
  req.user = await resolveUserFromToken(token);
  next();
});

const authenticateOptional = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = await resolveUserFromToken(token);
  } catch (error) {
    req.user = null;
  }
  return next();
});

const authorize = (...allowedRoles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(`This area is only available to ${allowedRoles.join(' / ')} accounts`);
    }
    next();
  });

const requireAdmin = authorize(ROLES.ADMIN);

module.exports = {
  authenticate,
  authenticateOptional,
  authorize,
  requireAdmin,
  resolveUserFromToken,
};
