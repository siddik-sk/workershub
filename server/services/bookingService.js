const Booking = require('../models/Booking');
const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const ServiceCategory = require('../models/ServiceCategory');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const {
  ROLES,
  ACCOUNT_STATUS,
  APPROVAL_STATUS,
  BOOKING_STATUS,
  ACTIVE_BOOKING_STATUSES,
  NOTIFICATION_TYPES,
} = require('../utils/constants');
const {
  parseDateOnly,
  utcStartOfDay,
  formatDateLong,
  formatTime12h,
  appointmentDateKey,
  weekdayName,
} = require('../utils/dates');
const { generateBookingReference } = require('../utils/generators');
const { createNotification } = require('./notificationService');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { escapeRegex } = require('../utils/serializers');

const BOOKING_POPULATE = [
  { path: 'customerId', select: 'name email phone city locality accountStatus' },
  { path: 'workerId', select: 'name email phone city locality accountStatus' },
  {
    path: 'workerProfileId',
    select: 'profileImage averageRating totalReviews completedJobs experienceYears serviceCharge',
  },
  { path: 'serviceCategoryId', select: 'name slug icon' },
];

function populateBooking(query) {
  return query.populate(BOOKING_POPULATE);
}

function workerSummary(booking, viewerRole) {
  const worker = booking.workerId || {};
  const profile = booking.workerProfileId || {};
  const seenStatuses = [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED];
  const staffView = viewerRole === ROLES.ADMIN || viewerRole === ROLES.WORKER;
  const canSeePhone =
    staffView || (viewerRole === ROLES.CUSTOMER && seenStatuses.includes(booking.status));
  return {
    id: String(worker._id || ''),
    name: worker.name || 'Professional',
    profileId: profile._id ? String(profile._id) : '',
    email: staffView ? worker.email : undefined,
    phone: canSeePhone ? worker.phone : undefined,
    city: worker.city || '',
    locality: worker.locality || '',
    profileImage: profile.profileImage || '',
    experienceYears: profile.experienceYears || 0,
    averageRating: profile.averageRating || 0,
    totalReviews: profile.totalReviews || 0,
    completedJobs: profile.completedJobs || 0,
    serviceCharge: profile.serviceCharge || 0,
  };
}

function customerSummary(booking, viewerRole) {
  const customer = booking.customerId || {};
  const showPhone =
    viewerRole === ROLES.WORKER ||
    viewerRole === ROLES.ADMIN ||
    (viewerRole === ROLES.CUSTOMER && String(customer._id) === String(booking.customerId?._id));
  const showEmail = viewerRole === ROLES.ADMIN;
  return {
    id: String(customer._id || ''),
    name: customer.name || 'Customer',
    phone: showPhone ? customer.phone : undefined,
    email: showEmail ? customer.email : undefined,
    city: customer.city || '',
    locality: customer.locality || '',
  };
}

function serializeBooking(booking, viewerRole) {
  const doc = booking.toObject ? booking.toObject() : booking;
  return {
    id: String(doc._id),
    bookingReference: doc.bookingReference,
    status: doc.status,
    serviceDescription: doc.serviceDescription,
    appointmentDate: doc.appointmentDate,
    appointmentTime: doc.appointmentTime,
    serviceAddress: doc.serviceAddress,
    city: doc.city,
    locality: doc.locality,
    customerName: doc.customerName || doc.customerId?.name || '',
    customerPhone: doc.customerPhone,
    additionalNotes: doc.additionalNotes,
    rejectionReason: doc.rejectionReason || '',
    cancellationReason: doc.cancellationReason || '',
    cancelledBy: doc.cancelledBy || '',
    acceptedAt: doc.acceptedAt,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
    cancelledAt: doc.cancelledAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    workerProfileId: doc.workerProfileId?._id
      ? String(doc.workerProfileId._id)
      : doc.workerProfileId
        ? String(doc.workerProfileId)
        : '',
    statusHistory: doc.statusHistory || [],
    customer: customerSummary(doc, viewerRole),
    worker: workerSummary(doc, viewerRole),
    category: doc.serviceCategoryId && doc.serviceCategoryId.name
      ? {
          id: String(doc.serviceCategoryId._id),
          name: doc.serviceCategoryId.name,
          slug: doc.serviceCategoryId.slug,
          icon: doc.serviceCategoryId.icon,
        }
      : null,
  };
}

function assertBookingVisible(booking, user) {
  if (user.role === ROLES.ADMIN) return;
  if (user.role === ROLES.CUSTOMER && String(booking.customerId?._id || booking.customerId) === String(user._id)) return;
  if (user.role === ROLES.WORKER && String(booking.workerId?._id || booking.workerId) === String(user._id)) return;
  throw ApiError.forbidden('You do not have access to this booking');
}

async function validateAppointment(profile, rawDate, rawTime) {
  const date = parseDateOnly(rawDate, 'Appointment date');
  const today = utcStartOfDay();
  if (date < today) throw ApiError.badRequest('Appointment date cannot be in the past');
  const maxDate = new Date(today);
  maxDate.setUTCDate(maxDate.getUTCDate() + 90);
  if (date > maxDate) throw ApiError.badRequest('Appointments can be booked up to 90 days in advance');

  if (profile.availability && profile.availability.isAvailable === false) {
    throw ApiError.badRequest('This professional is currently not accepting new bookings');
  }

  const day = weekdayName(date);
  if (profile.availability?.days?.length && !profile.availability.days.includes(day)) {
    throw ApiError.badRequest(`This professional does not work on ${day.charAt(0).toUpperCase() + day.slice(1)}`);
  }

  const time = String(rawTime || '');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw ApiError.badRequest('Appointment time must be in HH:MM format');
  }
  if (profile.availability?.startTime && time < profile.availability.startTime) {
    throw ApiError.badRequest(`Appointment time must be after ${formatTime12h(profile.availability.startTime)}`);
  }
  if (profile.availability?.endTime && time >= profile.availability.endTime) {
    throw ApiError.badRequest(`Appointment time must be before ${formatTime12h(profile.availability.endTime)}`);
  }

  return date;
}

async function createBooking(customer, payload) {
  const worker = await User.findOne({
    _id: payload.workerId,
    role: ROLES.WORKER,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  });
  if (!worker) throw ApiError.notFound('Professional not found or unavailable');

  const profile = await WorkerProfile.findOne({ userId: worker._id })
    .populate('serviceCategoryId')
    .populate('additionalServices');
  if (!profile || profile.approvalStatus !== APPROVAL_STATUS.APPROVED) {
    throw ApiError.badRequest('This professional is not currently available for bookings');
  }

  const offeredIds = [
    String(profile.serviceCategoryId?._id || profile.serviceCategoryId),
    ...(profile.additionalServices || []).map((service) => String(service._id || service)),
  ];
  const requestedCategoryId = String(payload.serviceCategoryId || offeredIds[0]);
  if (!offeredIds.includes(requestedCategoryId)) {
    throw ApiError.badRequest('This professional does not offer the selected service');
  }
  const category = await ServiceCategory.findOne({ _id: requestedCategoryId, isActive: true });
  if (!category) throw ApiError.badRequest('The selected service category is unavailable');

  const appointmentDate = await validateAppointment(profile, payload.appointmentDate, payload.appointmentTime);

  const duplicate = await Booking.findOne({
    customerId: customer._id,
    workerId: worker._id,
    appointmentDate,
    appointmentTime: payload.appointmentTime,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });
  if (duplicate) {
    throw ApiError.conflict('You already have an active request for this professional at that time');
  }

  const conflictingSlot = await Booking.findOne({
    workerId: worker._id,
    appointmentDate,
    appointmentTime: payload.appointmentTime,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });
  if (conflictingSlot) {
    throw ApiError.conflict('This professional is already booked for that appointment slot. Please choose another time.');
  }

  let booking = null;
  let lastError = null;
  for (let attempt = 0; attempt < 5 && !booking; attempt += 1) {
    try {
      booking = await Booking.create({
        bookingReference: generateBookingReference(),
        customerId: customer._id,
        workerId: worker._id,
        workerProfileId: profile._id,
        serviceCategoryId: category._id,
        serviceDescription: payload.serviceDescription.trim(),
        appointmentDate,
        appointmentTime: payload.appointmentTime,
        serviceAddress: payload.serviceAddress.trim(),
        city: payload.city.trim(),
        locality: payload.locality.trim(),
        customerName: (payload.customerName || customer.name).trim(),
        customerPhone: payload.customerPhone.trim(),
        additionalNotes: (payload.additionalNotes || '').trim(),
        status: BOOKING_STATUS.PENDING,
        statusHistory: [
          {
            status: BOOKING_STATUS.PENDING,
            changedBy: customer._id,
            note: 'Booking request submitted by customer',
            changedAt: new Date(),
          },
        ],
      });
    } catch (error) {
      lastError = error;
      if (error.code === 11000 && error.keyPattern?.workerId) {
        throw ApiError.conflict('This professional is already booked for that appointment slot. Please choose another time.');
      }
      if (!(error.code === 11000 && error.keyPattern?.bookingReference)) {
        throw error;
      }
    }
  }
  if (!booking) throw lastError || ApiError.conflict('Could not create booking. Please try again.');

  const when = `${formatDateLong(appointmentDate)} at ${formatTime12h(payload.appointmentTime)}`;

  await createNotification({
    recipientId: worker._id,
    type: NOTIFICATION_TYPES.BOOKING_NEW,
    title: 'New booking request!',
    message: `${customer.name} has requested your ${category.name} service for ${when}. Reference ${booking.bookingReference}.`,
    relatedBookingId: booking._id,
    actionUrl: `/worker/bookings/${booking._id}`,
  });

  await createNotification({
    recipientId: customer._id,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'Booking request sent',
    message: `Your ${category.name} request for ${when} was sent to ${worker.name}. Reference ${booking.bookingReference}. We will notify you when it is accepted.`,
    relatedBookingId: booking._id,
    actionUrl: `/app/bookings/${booking._id}`,
  });

  const populated = await populateBooking(Booking.findById(booking._id));
  return serializeBooking(populated, ROLES.CUSTOMER);
}

async function listCustomerBookings(customerId, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { customerId };
  if (query.status && Object.values(BOOKING_STATUS).includes(query.status)) {
    filter.status = query.status;
  }
  if (query.search) {
    filter.bookingReference = { $regex: escapeRegex(query.search.toUpperCase()), $options: 'i' };
  }
  const [bookings, total] = await Promise.all([
    populateBooking(Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Booking.countDocuments(filter),
  ]);
  return {
    bookings: bookings.map((booking) => serializeBooking(booking, ROLES.CUSTOMER)),
    pagination: paginationMeta(total, page, limit),
  };
}

async function listWorkerBookings(workerId, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { workerId };
  if (query.status && Object.values(BOOKING_STATUS).includes(query.status)) {
    filter.status = query.status;
  }
  if (query.search) {
    filter.bookingReference = { $regex: escapeRegex(query.search.toUpperCase()), $options: 'i' };
  }
  if (query.appointmentDate) {
    filter.appointmentDate = parseDateOnly(query.appointmentDate, 'Appointment date');
  }
  const [bookings, total] = await Promise.all([
    populateBooking(Booking.find(filter).sort({ appointmentDate: 1, appointmentTime: 1, createdAt: -1 }).skip(skip).limit(limit)),
    Booking.countDocuments(filter),
  ]);
  return {
    bookings: bookings.map((booking) => serializeBooking(booking, ROLES.WORKER)),
    pagination: paginationMeta(total, page, limit),
  };
}

async function getBookingById(bookingId, user) {
  const booking = await populateBooking(Booking.findById(bookingId));
  if (!booking) throw ApiError.notFound('Booking not found');
  assertBookingVisible(booking, user);
  const review = await Review.findOne({ bookingId: booking._id }).populate('customerId', 'name');
  const result = serializeBooking(booking, user.role);
  result.review = review
    ? {
        id: String(review._id),
        rating: review.rating,
        comment: review.comment,
        customerName: review.customerId?.name || 'Customer',
        createdAt: review.createdAt,
      }
    : null;
  return result;
}

async function getWorkerByBooking(bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
}

async function workerAccept(bookingId, workerId) {
  const profile = await WorkerProfile.findOne({ userId: workerId });
  if (!profile || profile.approvalStatus !== APPROVAL_STATUS.APPROVED) {
    throw ApiError.forbidden('Only approved professionals can accept bookings');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.workerId) !== String(workerId)) {
    throw ApiError.forbidden('This booking does not belong to you');
  }
  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw ApiError.conflict(`This booking can no longer be accepted (current status: ${booking.status})`);
  }
  if (new Date(booking.appointmentDate) < utcStartOfDay()) {
    throw ApiError.badRequest('This appointment date has already passed');
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, workerId, status: BOOKING_STATUS.PENDING },
    {
      $set: { status: BOOKING_STATUS.ACCEPTED, acceptedAt: new Date() },
      $push: {
        statusHistory: {
          status: BOOKING_STATUS.ACCEPTED,
          changedBy: workerId,
          note: 'Booking accepted by professional',
          changedAt: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('This booking was already updated. Please refresh.');

  const populated = await populateBooking(Booking.findById(updated._id));
  const category = populated.serviceCategoryId?.name || 'service';
  await createNotification({
    recipientId: populated.customerId._id,
    type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
    title: 'Your booking was accepted',
    message: `${populated.workerId.name} accepted your ${category} booking for ${formatDateLong(populated.appointmentDate)} at ${formatTime12h(populated.appointmentTime)}. Reference ${populated.bookingReference}.`,
    relatedBookingId: populated._id,
    actionUrl: `/app/bookings/${populated._id}`,
  });

  return serializeBooking(populated, ROLES.WORKER);
}

async function workerReject(bookingId, workerId, reason = '') {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.workerId) !== String(workerId)) {
    throw ApiError.forbidden('This booking does not belong to you');
  }
  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw ApiError.conflict(`This booking can no longer be rejected (current status: ${booking.status})`);
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, workerId, status: BOOKING_STATUS.PENDING },
    {
      $set: {
        status: BOOKING_STATUS.REJECTED,
        rejectionReason: String(reason || '').trim().slice(0, 500),
      },
      $push: {
        statusHistory: {
          status: BOOKING_STATUS.REJECTED,
          changedBy: workerId,
          note: reason ? `Rejected: ${String(reason).slice(0, 400)}` : 'Rejected by professional',
          changedAt: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('This booking was already updated. Please refresh.');

  const populated = await populateBooking(Booking.findById(updated._id));
  await createNotification({
    recipientId: populated.customerId._id,
    type: NOTIFICATION_TYPES.BOOKING_REJECTED,
    title: 'Booking request declined',
    message: `${populated.workerId.name} could not take your ${populated.serviceCategoryId?.name || 'service'} booking for ${formatDateLong(populated.appointmentDate)}.${reason ? ` Reason: ${reason}` : ''} Reference ${populated.bookingReference}.`,
    relatedBookingId: populated._id,
    actionUrl: `/app/bookings/${populated._id}`,
  });

  return serializeBooking(populated, ROLES.WORKER);
}

async function workerStart(bookingId, workerId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.workerId) !== String(workerId)) throw ApiError.forbidden('This booking does not belong to you');
  if (booking.status !== BOOKING_STATUS.ACCEPTED) {
    throw ApiError.conflict('Only accepted bookings can be started');
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, workerId, status: BOOKING_STATUS.ACCEPTED },
    {
      $set: { status: BOOKING_STATUS.IN_PROGRESS, startedAt: new Date() },
      $push: {
        statusHistory: {
          status: BOOKING_STATUS.IN_PROGRESS,
          changedBy: workerId,
          note: 'Work started',
          changedAt: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('This booking was already updated. Please refresh.');

  const populated = await populateBooking(Booking.findById(updated._id));
  await createNotification({
    recipientId: populated.customerId._id,
    type: NOTIFICATION_TYPES.BOOKING_IN_PROGRESS,
    title: 'Your service has started',
    message: `${populated.workerId.name} has started work on your ${populated.serviceCategoryId?.name || 'service'} booking (${populated.bookingReference}).`,
    relatedBookingId: populated._id,
    actionUrl: `/app/bookings/${populated._id}`,
  });
  return serializeBooking(populated, ROLES.WORKER);
}

async function workerComplete(bookingId, workerId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.workerId) !== String(workerId)) throw ApiError.forbidden('This booking does not belong to you');
  if (booking.status !== BOOKING_STATUS.IN_PROGRESS) {
    throw ApiError.conflict('Only in-progress bookings can be completed');
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, workerId, status: BOOKING_STATUS.IN_PROGRESS },
    {
      $set: { status: BOOKING_STATUS.COMPLETED, completedAt: new Date() },
      $push: {
        statusHistory: {
          status: BOOKING_STATUS.COMPLETED,
          changedBy: workerId,
          note: 'Work completed',
          changedAt: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('This booking was already updated. Please refresh.');

  await WorkerProfile.updateOne({ userId: workerId }, { $inc: { completedJobs: 1 } });

  const populated = await populateBooking(Booking.findById(updated._id));
  await createNotification({
    recipientId: populated.customerId._id,
    type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
    title: 'Your service is complete',
    message: `${populated.workerId.name} marked your ${populated.serviceCategoryId?.name || 'service'} booking as completed. Please leave a review to help other customers. Reference ${populated.bookingReference}.`,
    relatedBookingId: populated._id,
    actionUrl: `/app/bookings/${populated._id}`,
  });
  return serializeBooking(populated, ROLES.WORKER);
}

async function cancelBooking(bookingId, user, reason, actor = 'customer') {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  if (actor === 'customer') {
    if (user.role !== ROLES.CUSTOMER || String(booking.customerId) !== String(user._id)) {
      throw ApiError.forbidden('You do not have access to this booking');
    }
  } else if (actor === 'worker') {
    if (user.role !== ROLES.WORKER || String(booking.workerId) !== String(user._id)) {
      throw ApiError.forbidden('You do not have access to this booking');
    }
  }

  if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
    throw ApiError.conflict(`A ${booking.status} booking cannot be cancelled`);
  }

  const appointment = new Date(
    `${new Date(booking.appointmentDate).toISOString().slice(0, 10)}T${booking.appointmentTime}:00.000Z`
  );
  const hoursUntil = (appointment.getTime() - Date.now()) / (1000 * 60 * 60);

  if (actor === 'customer') {
    if (booking.status === BOOKING_STATUS.ACCEPTED && hoursUntil < 12) {
      throw ApiError.badRequest('Accepted bookings can only be cancelled at least 12 hours before the appointment');
    }
    if (booking.status === BOOKING_STATUS.IN_PROGRESS) {
      throw ApiError.badRequest('A job that is in progress cannot be cancelled by the customer. Please contact support.');
    }
  }
  if (actor === 'worker') {
    if (booking.status !== BOOKING_STATUS.ACCEPTED) {
      throw ApiError.badRequest('Only accepted bookings can be cancelled by the professional');
    }
    if (hoursUntil < 2) {
      throw ApiError.badRequest('You can only cancel at least 2 hours before the appointment');
    }
  }
  if (actor === 'admin' && booking.status === BOOKING_STATUS.IN_PROGRESS) {
    throw ApiError.badRequest('An in-progress job cannot be cancelled. Contact the parties and complete or resolve it manually.');
  }

  const cancellationReason = String(reason || '').trim().slice(0, 500) || 'No reason provided';
  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, status: booking.status },
    {
      $set: {
        status: BOOKING_STATUS.CANCELLED,
        cancellationReason,
        cancelledBy: actor,
        cancelledAt: new Date(),
      },
      $push: {
        statusHistory: {
          status: BOOKING_STATUS.CANCELLED,
          changedBy: user._id,
          note: `Cancelled by ${actor}. ${cancellationReason}`,
          changedAt: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('This booking was already updated. Please refresh.');

  const populated = await populateBooking(Booking.findById(updated._id));
  const recipientId = actor === 'customer' ? populated.workerId._id : populated.customerId._id;
  const recipientName = actor === 'customer' ? populated.workerId.name : populated.customerId.name;
  await createNotification({
    recipientId,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    title: 'Booking cancelled',
    message: `${actor === 'customer' ? populated.customerId.name : actor === 'worker' ? populated.workerId.name : 'An administrator'} cancelled the booking (${populated.bookingReference})${actor === 'admin' ? ` for ${recipientName}` : ''}. Reason: ${cancellationReason}.`,
    relatedBookingId: populated._id,
    actionUrl:
      actor === 'customer'
        ? `/worker/bookings/${populated._id}`
        : `/app/bookings/${populated._id}`,
  });

  return serializeBooking(populated, user.role);
}

async function addReview(bookingId, customerId, rating, comment) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== String(customerId)) {
    throw ApiError.forbidden('You can only review your own bookings');
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest('You can only review completed bookings');
  }
  const existing = await Review.findOne({ bookingId });
  if (existing) throw ApiError.conflict('You have already reviewed this booking');

  const review = await Review.create({
    bookingId,
    customerId,
    workerId: booking.workerId,
    rating,
    comment: String(comment || '').trim(),
  });

  const aggregate = await Review.aggregate([
    { $match: { workerId: booking.workerId } },
    { $group: { _id: '$workerId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (aggregate.length) {
    await WorkerProfile.updateOne(
      { userId: booking.workerId },
      {
        $set: {
          averageRating: Math.round(aggregate[0].average * 10) / 10,
          totalReviews: aggregate[0].count,
        },
      }
    );
  }

  await createNotification({
    recipientId: booking.workerId,
    type: NOTIFICATION_TYPES.BOOKING_REVIEW,
    title: 'New customer review',
    message: `A customer rated you ${rating}/5 for booking ${booking.bookingReference}.${comment ? ` "${String(comment).slice(0, 160)}"` : ''}`,
    relatedBookingId: booking._id,
    actionUrl: '/worker/profile',
  });

  return review;
}

async function getUpcomingForWorker(workerId, limit = 5) {
  const bookings = await populateBooking(
    Booking.find({
      workerId,
      status: { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS] },
      appointmentDate: { $gte: utcStartOfDay() },
    })
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(limit)
  );
  return bookings.map((booking) => serializeBooking(booking, ROLES.WORKER));
}

module.exports = {
  createBooking,
  listCustomerBookings,
  listWorkerBookings,
  getBookingById,
  getWorkerByBooking,
  workerAccept,
  workerReject,
  workerStart,
  workerComplete,
  cancelBooking,
  addReview,
  getUpcomingForWorker,
  serializeBooking,
  populateBooking,
  appointmentDateKey,
};
