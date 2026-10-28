const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { getPagination, paginationMeta } = require('../utils/pagination');

const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { recipientId: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  if (req.query.type) filter.type = req.query.type;
  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: req.user._id, isRead: false }),
  ]);
  res.json({
    success: true,
    data: {
      notifications: notifications.map((notification) => ({
        id: String(notification._id),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedBookingId: notification.relatedBookingId ? String(notification.relatedBookingId) : null,
        actionUrl: notification.actionUrl,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      })),
      pagination: paginationMeta(total, page, limit),
      unread,
    },
  });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipientId: req.user._id, isRead: false });
  res.json({ success: true, data: { unread: count } });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  const unread = await Notification.countDocuments({ recipientId: req.user._id, isRead: false });
  res.json({ success: true, data: { notification: { id: String(notification._id), isRead: true }, unread } });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipientId: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json({ success: true, data: { modified: result.modifiedCount, unread: 0 } });
});

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
