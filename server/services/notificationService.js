const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser } = require('../sockets');
const { ROLES, ACCOUNT_STATUS } = require('../utils/constants');

/**
 * Persist first, then attempt a best-effort real-time delivery. A socket emission
 * is intentionally never treated as proof of delivery or read state.
 */
async function createNotification({
  recipientId,
  type,
  title,
  message,
  relatedBookingId = null,
  actionUrl = '',
}) {
  const notification = await Notification.create({
    recipientId,
    type,
    title,
    message,
    relatedBookingId,
    actionUrl,
  });

  emitToUser(recipientId, 'notification:new', {
    id: String(notification._id),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedBookingId: notification.relatedBookingId
      ? String(notification.relatedBookingId)
      : null,
    actionUrl: notification.actionUrl,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });

  return notification;
}

async function notifyAdmins(payload) {
  const admins = await User.find({
    role: ROLES.ADMIN,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  }).select('_id');

  return Promise.all(
    admins.map((admin) => createNotification({ ...payload, recipientId: admin._id }))
  );
}

async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipientId: userId, isRead: false });
}

module.exports = { createNotification, notifyAdmins, getUnreadCount };
