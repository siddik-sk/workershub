const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const WorkerProfile = require('../models/WorkerProfile');
const ApiError = require('../utils/ApiError');
const { ROLES, BOOKING_STATUS, ACCOUNT_STATUS } = require('../utils/constants');
const { utcStartOfDay } = require('../utils/dates');
const { publicUser } = require('../utils/serializers');
const { populateBooking, serializeBooking } = require('./bookingService');

async function getCustomerDashboard(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();

  const [statusRows, recent, upcoming, unread] = await Promise.all([
    Booking.aggregate([
      { $match: { customerId: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    populateBooking(Booking.find({ customerId: user._id }).sort({ createdAt: -1 }).limit(5)),
    populateBooking(
      Booking.find({
        customerId: user._id,
        status: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS] },
        appointmentDate: { $gte: utcStartOfDay() },
      })
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .limit(3)
    ),
    Notification.countDocuments({ recipientId: user._id, isRead: false }),
  ]);

  const counts = Object.values(BOOKING_STATUS).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  statusRows.forEach((row) => {
    counts[row._id] = row.count;
  });

  return {
    user: publicUser(user),
    stats: {
      totalBookings: Object.values(counts).reduce((total, count) => total + count, 0),
      pending: counts.pending,
      accepted: counts.accepted,
      inProgress: counts.in_progress,
      completed: counts.completed,
      cancelled: counts.cancelled,
      active: counts.pending + counts.accepted + counts.in_progress,
      unreadNotifications: unread,
    },
    recentBookings: recent.map((booking) => serializeBooking(booking, ROLES.CUSTOMER)),
    upcoming: upcoming.map((booking) => serializeBooking(booking, ROLES.CUSTOMER)),
  };
}

async function updateCustomerProfile(userId, payload) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length < 2 || name.length > 80) throw ApiError.badRequest('Name must be between 2 and 80 characters');
    user.name = name;
  }
  if (payload.phone !== undefined) {
    const phone = String(payload.phone).trim();
    if (!/^[+0-9()\-\s]{7,25}$/.test(phone)) throw ApiError.badRequest('Enter a valid phone number');
    user.phone = phone;
  }
  if (payload.city !== undefined) user.city = String(payload.city).trim().slice(0, 80);
  if (payload.locality !== undefined) user.locality = String(payload.locality).trim().slice(0, 120);
  if (payload.name === undefined && payload.phone === undefined && payload.city === undefined && payload.locality === undefined) {
    throw ApiError.badRequest('No profile fields were supplied');
  }
  await user.save();
  return publicUser(user);
}

module.exports = { getCustomerDashboard, updateCustomerProfile };
