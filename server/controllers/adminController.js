const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/adminService');
const bookingService = require('../services/bookingService');
const Notification = require('../models/Notification');

const dashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard(req.query);
  res.json({ success: true, data });
});

const listUsers = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.json({ success: true, data });
});

const getUser = asyncHandler(async (req, res) => {
  const data = await adminService.getUserDetail(req.params.id);
  res.json({ success: true, data });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const data = await adminService.setUserStatus(
    req.user._id,
    req.params.id,
    req.body.accountStatus,
    req.body.reason,
    req.ip
  );
  res.json({ success: true, message: `Account ${data.accountStatus}.`, data });
});

const listWorkers = asyncHandler(async (req, res) => {
  const data = await adminService.listWorkers(req.query);
  res.json({ success: true, data });
});

const getWorker = asyncHandler(async (req, res) => {
  const data = await adminService.getWorkerAdminDetail(req.params.id);
  res.json({ success: true, data });
});

const setWorkerApproval = asyncHandler(async (req, res) => {
  const data = await adminService.setWorkerApproval(
    req.user._id,
    req.params.id,
    req.body.approvalStatus,
    req.body.reason,
    req.ip
  );
  res.json({ success: true, message: `Worker application ${data.approvalStatus}.`, data });
});

const setWorkerAccountStatus = asyncHandler(async (req, res) => {
  const data = await adminService.setWorkerAccountStatus(
    req.user._id,
    req.params.id,
    req.body.accountStatus,
    req.body.reason,
    req.ip
  );
  res.json({ success: true, message: `Worker account ${data.accountStatus}.`, data });
});

const listCategories = asyncHandler(async (_req, res) => {
  const categories = await adminService.listCategoriesForAdmin();
  res.json({ success: true, data: { categories } });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.user._id, req.body, req.ip);
  res.status(201).json({ success: true, message: 'Service category created.', data: { category } });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await adminService.updateCategory(req.user._id, req.params.id, req.body, req.ip);
  res.json({ success: true, message: 'Service category updated.', data: { category } });
});

const listBookings = asyncHandler(async (req, res) => {
  const data = await adminService.listBookings(req.query);
  res.json({ success: true, data });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, { _id: req.user._id, role: 'admin' });
  res.json({ success: true, data: { booking } });
});

const bookingStats = asyncHandler(async (_req, res) => {
  const data = await adminService.getBookingStatistics();
  res.json({ success: true, data });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await adminService.cancelBookingAdmin(req.user._id, req.params.id, req.body.reason, req.ip);
  res.json({ success: true, message: 'Booking cancelled by administrator.', data: { booking } });
});

const auditLogs = asyncHandler(async (req, res) => {
  const data = await adminService.listAuditLogs(req.query);
  res.json({ success: true, data });
});

const adminNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({
    success: true,
    data: {
      notifications: notifications.map((notification) => ({
        id: String(notification._id),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      })),
    },
  });
});

module.exports = {
  dashboard,
  listUsers,
  getUser,
  setUserStatus,
  listWorkers,
  getWorker,
  setWorkerApproval,
  setWorkerAccountStatus,
  listCategories,
  createCategory,
  updateCategory,
  listBookings,
  getBooking,
  bookingStats,
  cancelBooking,
  auditLogs,
  adminNotifications,
};
