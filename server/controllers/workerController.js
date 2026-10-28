const asyncHandler = require('../utils/asyncHandler');
const workerService = require('../services/workerService');
const authService = require('../services/authService');
const { publicWorkerProfile } = require('../utils/serializers');

const searchWorkers = asyncHandler(async (req, res) => {
  const result = await workerService.searchWorkers(req.query);
  res.json({ success: true, data: result });
});

const featuredWorkers = asyncHandler(async (req, res) => {
  const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6));
  const workers = await workerService.getFeaturedWorkers(limit);
  res.json({ success: true, data: { workers } });
});

const getWorker = asyncHandler(async (req, res) => {
  const result = await workerService.getPublicWorker(req.params.id);
  res.json({ success: true, data: result });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await workerService.getWorkerDashboard(req.user._id);
  res.json({ success: true, data });
});

const getProfile = asyncHandler(async (req, res) => {
  const bundle = await authService.getMe(req.user._id);
  if (!bundle.workerProfile) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Worker profile not found' } });
  }
  return res.json({ success: true, data: bundle });
});

const updateProfile = asyncHandler(async (req, res) => {
  const result = await workerService.updateWorkerProfile(req.user._id, req.body, req.file);
  const populated = publicWorkerProfile(
    await require('../models/WorkerProfile').findById(result.profile._id)
      .populate('serviceCategoryId')
      .populate('additionalServices')
  );
  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user: result.user, workerProfile: populated },
  });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const availability = await workerService.updateAvailability(req.user._id, req.body);
  res.json({ success: true, message: 'Availability updated.', data: { availability } });
});

module.exports = {
  searchWorkers,
  featuredWorkers,
  getWorker,
  getDashboard,
  getProfile,
  updateProfile,
  updateAvailability,
};
