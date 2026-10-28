const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

const dashboard = asyncHandler(async (req, res) => {
  const data = await userService.getCustomerDashboard(req.user._id);
  res.json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateCustomerProfile(req.user._id, req.body);
  res.json({ success: true, message: 'Profile updated.', data: { user } });
});

module.exports = { dashboard, updateProfile };
