const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const notificationService = require('../services/notificationService');
const { signAuthToken, setAuthCookie, clearAuthCookie } = require('../utils/tokens');
const { ROLES } = require('../utils/constants');

const registerCustomer = asyncHandler(async (req, res) => {
  const result = await authService.registerCustomer(req.body);
  const bundle = await authService.getMe(result.user.id);
  const token = signAuthToken({ _id: result.user.id, role: ROLES.CUSTOMER, tokenVersion: 0 });
  setAuthCookie(res, token, ROLES.CUSTOMER);
  res.status(201).json({
    success: true,
    message: 'Your account was created successfully.',
    data: { ...bundle, unreadNotifications: 0 },
  });
});

const registerWorker = asyncHandler(async (req, res) => {
  const result = await authService.registerWorker(req.body, req.file);
  const bundle = await authService.getMe(result.user.id);
  const token = signAuthToken({ _id: result.user.id, role: ROLES.WORKER, tokenVersion: 0 });
  setAuthCookie(res, token, ROLES.WORKER);
  res.status(201).json({
    success: true,
    message:
      'Your application was submitted. Your account is pending administrator approval before it appears in search results.',
    data: {
      ...bundle,
      unreadNotifications: 0,
      pending: true,
      approvalStatus: bundle.workerProfile?.approvalStatus || 'pending',
    },
  });
});

function loginHandler(expectedRole) {
  return asyncHandler(async (req, res) => {
    const result = await authService.login({ ...req.body, expectedRole });
    const bundle = await authService.getMe(result.user.id);
    const token = signAuthToken({
      _id: result.user.id,
      role: result.role,
      tokenVersion: result.tokenVersion,
    });
    setAuthCookie(res, token, result.role);
    const unreadNotifications = await notificationService.getUnreadCount(result.user.id);
    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: { ...bundle, unreadNotifications },
    });
  });
}

const me = asyncHandler(async (req, res) => {
  const bundle = await authService.getMe(req.user._id);
  const unreadNotifications = await notificationService.getUnreadCount(req.user._id);
  res.json({ success: true, data: { ...bundle, unreadNotifications } });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'You have been logged out.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  res.json({ success: true, message: result.message, data: result.devResetUrl ? { devResetUrl: result.devResetUrl } : undefined });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body.token, req.body.password);
  clearAuthCookie(res);
  res.json({ success: true, message: result.message });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  const token = signAuthToken({
    _id: user._id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  setAuthCookie(res, token, user.role);
  res.json({ success: true, message: 'Your password has been updated.' });
});

module.exports = {
  registerCustomer,
  registerWorker,
  loginHandler,
  me,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
