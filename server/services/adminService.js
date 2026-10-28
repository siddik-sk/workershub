const mongoose = require('mongoose');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const ServiceCategory = require('../models/ServiceCategory');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const ApiError = require('../utils/ApiError');
const {
  ROLES,
  ACCOUNT_STATUS,
  APPROVAL_STATUS,
  BOOKING_STATUS,
} = require('../utils/constants');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { escapeRegex } = require('../utils/serializers');
const { parseDateOnly, utcStartOfDay, addDays } = require('../utils/dates');
const { createNotification } = require('./notificationService');
const { NOTIFICATION_TYPES } = require('../utils/constants');
const { populateBooking, serializeBooking, getBookingById } = require('./bookingService');

function getDateRange(query) {
  const now = new Date();
  const defaultDays = query.range === '7d' ? 7 : query.range === '90d' ? 90 : 30;
  let from = utcStartOfDay(addDays(now, -(defaultDays - 1)));
  let to = new Date(now);
  if (query.from) from = parseDateOnly(query.from, 'From date');
  if (query.to) {
    to = new Date(parseDateOnly(query.to, 'To date'));
    to.setUTCHours(23, 59, 59, 999);
  }
  if (to < from) throw ApiError.badRequest('The end date must be after the start date');
  const maxDays = 366;
  if ((to - from) / (1000 * 60 * 60 * 24) > maxDays) {
    throw ApiError.badRequest('Date range cannot exceed 366 days');
  }
  return { from, to };
}

function startOfWeek(date = new Date()) {
  const copy = utcStartOfDay(date);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(copy, diff);
}

function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function fillDailySeries(rows, from, to, keys) {
  const map = new Map();
  rows.forEach((row) => {
    const date = row._id.date;
    if (!map.has(date)) map.set(date, { date });
    map.get(date)[row._id.key] = row.count;
  });
  const series = [];
  let cursor = utcStartOfDay(from);
  const end = utcStartOfDay(to);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = { date: key };
    keys.forEach((name) => {
      entry[name] = map.get(key)?.[name] || 0;
    });
    series.push(entry);
    cursor = addDays(cursor, 1);
  }
  return series;
}

async function writeAuditLog({ adminId, action, targetType, targetId, description, metadata, ipAddress }) {
  return AdminAuditLog.create({
    adminId,
    action,
    targetType,
    targetId: targetId ? String(targetId) : '',
    description,
    metadata: metadata || {},
    ipAddress: ipAddress || '',
  });
}

async function getDashboard(query) {
  const { from, to } = getDateRange(query);
  const today = utcStartOfDay();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const tomorrow = addDays(today, 1);

  const [
    totalUsers,
    totalWorkers,
    approvedWorkers,
    pendingWorkers,
    rejectedWorkers,
    suspendedAccounts,
    bookingCounts,
    newUsers,
    newWorkers,
    registrationRows,
    bookingTrendRows,
    categoryRows,
    statusRows,
    recentBookings,
    pendingWorkerList,
    totalBookings,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.CUSTOMER }),
    User.countDocuments({ role: ROLES.WORKER }),
    WorkerProfile.countDocuments({ approvalStatus: APPROVAL_STATUS.APPROVED }),
    WorkerProfile.countDocuments({ approvalStatus: APPROVAL_STATUS.PENDING }),
    WorkerProfile.countDocuments({ approvalStatus: APPROVAL_STATUS.REJECTED }),
    User.countDocuments({ role: ROLES.WORKER, accountStatus: ACCOUNT_STATUS.SUSPENDED }),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: ROLES.CUSTOMER, createdAt: { $gte: today, $lt: tomorrow } } },
      { $count: 'count' },
    ]),
    User.aggregate([
      { $match: { role: ROLES.WORKER, createdAt: { $gte: today, $lt: tomorrow } } },
      { $count: 'count' },
    ]),
    User.aggregate([
      {
        $match: {
          role: { $in: [ROLES.CUSTOMER, ROLES.WORKER] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            key: '$role',
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            key: 'bookings',
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$serviceCategoryId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: 'servicecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: '$_id',
          name: { $ifNull: ['$category.name', 'Unknown category'] },
          icon: { $ifNull: ['$category.icon', 'Wrench'] },
          count: 1,
        },
      },
    ]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    populateBooking(Booking.find().sort({ createdAt: -1 }).limit(8)),
    WorkerProfile.find({ approvalStatus: APPROVAL_STATUS.PENDING })
      .populate('userId', 'name email phone city locality accountStatus createdAt')
      .populate('serviceCategoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
    Booking.countDocuments(),
  ]);

  const counts = Object.values(BOOKING_STATUS).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  bookingCounts.forEach((row) => {
    counts[row._id] = row.count;
  });

  const newUsersWeek = await User.countDocuments({
    role: ROLES.CUSTOMER,
    createdAt: { $gte: weekStart },
  });
  const newUsersMonth = await User.countDocuments({
    role: ROLES.CUSTOMER,
    createdAt: { $gte: monthStart },
  });
  const newWorkersWeek = await User.countDocuments({
    role: ROLES.WORKER,
    createdAt: { $gte: weekStart },
  });
  const newWorkersMonth = await User.countDocuments({
    role: ROLES.WORKER,
    createdAt: { $gte: monthStart },
  });

  const newRegistrationsToday = (newUsers[0]?.count || 0) + (newWorkers[0]?.count || 0);

  return {
    range: { from, to },
    metrics: {
      totalUsers,
      totalWorkers,
      approvedWorkers,
      pendingWorkerApprovals: pendingWorkers,
      rejectedOrSuspendedWorkers: rejectedWorkers + suspendedAccounts,
      totalBookings,
      pendingBookings: counts.pending,
      acceptedBookings: counts.accepted,
      inProgressBookings: counts.in_progress,
      completedBookings: counts.completed,
      rejectedBookings: counts.rejected,
      cancelledBookings: counts.cancelled,
      newRegistrationsToday,
      newRegistrationsWeek: newUsersWeek + newWorkersWeek,
      newRegistrationsMonth: newUsersMonth + newWorkersMonth,
      newUsersToday: newUsers[0]?.count || 0,
      newWorkersToday: newWorkers[0]?.count || 0,
    },
    charts: {
      registrationGrowth: fillDailySeries(registrationRows, from, to, ['customer', 'worker']),
      bookingTrends: fillDailySeries(bookingTrendRows, from, to, ['bookings']),
      bookingsByCategory: categoryRows,
      statusDistribution: statusRows.map((row) => ({ status: row._id, count: row.count })),
    },
    recentBookings: recentBookings.map((booking) => serializeBooking(booking, ROLES.ADMIN)),
    pendingWorkers: pendingWorkerList.map((profile) => ({
      id: String(profile._id),
      name: profile.userId?.name || 'Worker',
      email: profile.userId?.email || '',
      phone: profile.userId?.phone || '',
      city: profile.city,
      locality: profile.locality,
      profession: profile.serviceCategoryId?.name || '',
      experienceYears: profile.experienceYears,
      createdAt: profile.createdAt,
    })),
  };
}

async function listUsers(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { role: query.role && [ROLES.CUSTOMER, ROLES.WORKER].includes(query.role) ? query.role : ROLES.CUSTOMER };
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  if (query.status && Object.values(ACCOUNT_STATUS).includes(query.status)) {
    filter.accountStatus = query.status;
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = parseDateOnly(query.from, 'From date');
    if (query.to) {
      const end = parseDateOnly(query.to, 'To date');
      end.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const ids = users.map((user) => user._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { customerId: { $in: ids } } },
    { $group: { _id: '$customerId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(bookingCounts.map((row) => [String(row._id), row.count]));

  return {
    users: users.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      locality: user.locality,
      role: user.role,
      accountStatus: user.accountStatus,
      suspensionReason: user.suspensionReason,
      bookingCount: countMap.get(String(user._id)) || 0,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    })),
    pagination: paginationMeta(total, page, limit),
  };
}

async function getUserDetail(userId) {
  if (!mongoose.isValidObjectId(userId)) throw ApiError.notFound('User not found');
  const user = await User.findOne({ _id: userId, role: { $in: [ROLES.CUSTOMER, ROLES.WORKER] } });
  if (!user) throw ApiError.notFound('User not found');

  const [bookings, workerProfile, reviews] = await Promise.all([
    populateBooking(Booking.find({ customerId: userId }).sort({ createdAt: -1 }).limit(25)),
    WorkerProfile.findOne({ userId })
      .populate('serviceCategoryId')
      .populate('additionalServices'),
    Review.find({ customerId: userId }).populate('workerId', 'name').sort({ createdAt: -1 }).limit(10),
  ]);

  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      city: user.city,
      locality: user.locality,
      accountStatus: user.accountStatus,
      suspensionReason: user.suspensionReason,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    workerProfile: workerProfile
      ? {
          id: String(workerProfile._id),
          profession: workerProfile.serviceCategoryId?.name || '',
          additionalServices: (workerProfile.additionalServices || []).map((c) => c.name),
          experienceYears: workerProfile.experienceYears,
          description: workerProfile.description,
          profileImage: workerProfile.profileImage,
          city: workerProfile.city,
          locality: workerProfile.locality,
          serviceAreas: workerProfile.serviceAreas,
          serviceCharge: workerProfile.serviceCharge,
          availability: workerProfile.availability,
          approvalStatus: workerProfile.approvalStatus,
          rejectionReason: workerProfile.rejectionReason,
          averageRating: workerProfile.averageRating,
          totalReviews: workerProfile.totalReviews,
          completedJobs: workerProfile.completedJobs,
          createdAt: workerProfile.createdAt,
        }
      : null,
    bookings: bookings.map((booking) => serializeBooking(booking, ROLES.ADMIN)),
    reviews: reviews.map((review) => ({
      id: String(review._id),
      rating: review.rating,
      comment: review.comment,
      workerName: review.workerId?.name || '',
      createdAt: review.createdAt,
    })),
  };
}

async function setUserStatus(adminId, userId, accountStatus, reason, ipAddress) {
  if (!Object.values(ACCOUNT_STATUS).includes(accountStatus)) throw ApiError.badRequest('Invalid account status');
  const user = await User.findOne({ _id: userId, role: { $in: [ROLES.CUSTOMER, ROLES.WORKER] } }).select('+tokenVersion');
  if (!user) throw ApiError.notFound('User not found');
  if (user.accountStatus === accountStatus) {
    throw ApiError.conflict(`This account is already ${accountStatus}`);
  }

  user.accountStatus = accountStatus;
  user.suspensionReason = accountStatus === ACCOUNT_STATUS.SUSPENDED ? String(reason || '').trim().slice(0, 500) : '';
  if (accountStatus === ACCOUNT_STATUS.SUSPENDED) user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  if (accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    await createNotification({
      recipientId: user._id,
      type: NOTIFICATION_TYPES.ACCOUNT_SUSPENDED,
      title: 'Account suspended',
      message: reason
        ? `Your account has been suspended. Reason: ${reason}`
        : 'Your account has been suspended. Please contact support.',
      actionUrl: '/support',
    });
  } else {
    await createNotification({
      recipientId: user._id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Account reactivated',
      message: 'Your account has been reactivated. You can use WorkConnect again.',
      actionUrl: user.role === ROLES.WORKER ? '/worker' : '/app',
    });
  }

  await writeAuditLog({
    adminId,
    action: accountStatus === ACCOUNT_STATUS.SUSPENDED ? 'user.suspend' : 'user.reactivate',
    targetType: 'user',
    targetId: user._id,
    description: `${accountStatus === ACCOUNT_STATUS.SUSPENDED ? 'Suspended' : 'Reactivated'} ${user.role} account ${user.email}${reason ? ` (reason: ${reason})` : ''}`,
    metadata: { accountStatus, reason },
    ipAddress,
  });

  return {
    id: String(user._id),
    accountStatus: user.accountStatus,
    suspensionReason: user.suspensionReason,
  };
}

async function listWorkers(query) {
  const { page, limit, skip } = getPagination(query);
  const match = {};
  if (query.approvalStatus && Object.values(APPROVAL_STATUS).includes(query.approvalStatus)) {
    match.approvalStatus = query.approvalStatus;
  }
  if (query.city) match.city = { $regex: `^${escapeRegex(query.city.trim())}$`, $options: 'i' };
  if (query.profession) {
    let category = null;
    if (mongoose.isValidObjectId(query.profession)) category = await ServiceCategory.findById(query.profession);
    else category = await ServiceCategory.findOne({ slug: String(query.profession).toLowerCase() });
    if (category) {
      match.$or = [{ serviceCategoryId: category._id }, { additionalServices: category._id }];
    }
  }

  const userMatch = { 'user.role': ROLES.WORKER };
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    userMatch.$or = [{ 'user.name': regex }, { 'user.email': regex }, { 'user.phone': regex }];
  }
  if (query.accountStatus && Object.values(ACCOUNT_STATUS).includes(query.accountStatus)) {
    userMatch['user.accountStatus'] = query.accountStatus;
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
        pipeline: [{ $project: { name: 1, email: 1, phone: 1, city: 1, locality: 1, accountStatus: 1, role: 1, createdAt: 1 } }],
      },
    },
    { $unwind: '$user' },
    { $match: userMatch },
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'serviceCategoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'bookings',
        localField: 'userId',
        foreignField: 'workerId',
        as: 'workerBookings',
        pipeline: [{ $project: { status: 1 } }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await WorkerProfile.aggregate(pipeline);
  const total = result?.total?.[0]?.count || 0;

  return {
    workers: (result?.items || []).map((profile) => ({
      id: String(profile._id),
      userId: String(profile.user._id),
      name: profile.user.name,
      email: profile.user.email,
      phone: profile.user.phone,
      city: profile.city,
      locality: profile.locality,
      profession: profile.category?.name || '',
      categoryId: profile.category?._id ? String(profile.category._id) : '',
      experienceYears: profile.experienceYears,
      serviceCharge: profile.serviceCharge,
      approvalStatus: profile.approvalStatus,
      rejectionReason: profile.rejectionReason,
      accountStatus: profile.user.accountStatus,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      completedJobs: profile.completedJobs,
      totalBookings: profile.workerBookings?.length || 0,
      createdAt: profile.createdAt,
    })),
    pagination: paginationMeta(total, page, limit),
  };
}

async function getWorkerAdminDetail(workerId) {
  if (!mongoose.isValidObjectId(workerId)) throw ApiError.notFound('Worker not found');
  const profile = await WorkerProfile.findById(workerId)
    .populate('userId')
    .populate('serviceCategoryId')
    .populate('additionalServices');
  if (!profile) throw ApiError.notFound('Worker not found');

  const [bookings, reviews, bookingStats] = await Promise.all([
    populateBooking(Booking.find({ workerId: profile.userId._id }).sort({ createdAt: -1 }).limit(25)),
    Review.find({ workerId: profile.userId._id }).populate('customerId', 'name').sort({ createdAt: -1 }).limit(15),
    Booking.aggregate([
      { $match: { workerId: profile.userId._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    worker: {
      id: String(profile._id),
      userId: String(profile.userId._id),
      name: profile.userId.name,
      email: profile.userId.email,
      phone: profile.userId.phone,
      city: profile.city,
      locality: profile.locality,
      serviceAreas: profile.serviceAreas,
      profession: profile.serviceCategoryId?.name || '',
      categoryId: profile.serviceCategoryId?._id ? String(profile.serviceCategoryId._id) : '',
      additionalServices: (profile.additionalServices || []).map((c) => ({ id: String(c._id), name: c.name })),
      experienceYears: profile.experienceYears,
      description: profile.description,
      profileImage: profile.profileImage,
      serviceCharge: profile.serviceCharge,
      availability: profile.availability,
      approvalStatus: profile.approvalStatus,
      rejectionReason: profile.rejectionReason,
      accountStatus: profile.userId.accountStatus,
      suspensionReason: profile.userId.suspensionReason,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      completedJobs: profile.completedJobs,
      createdAt: profile.createdAt,
      approvedAt: profile.approvedAt,
    },
    bookings: bookings.map((booking) => serializeBooking(booking, ROLES.ADMIN)),
    reviews: reviews.map((review) => ({
      id: String(review._id),
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerId?.name || 'Customer',
      createdAt: review.createdAt,
    })),
    bookingStats: bookingStats.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {}),
  };
}

async function setWorkerApproval(adminId, workerId, approvalStatus, reason, ipAddress) {
  if (![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED].includes(approvalStatus)) {
    throw ApiError.badRequest('Approval status must be approved or rejected');
  }
  if (approvalStatus === APPROVAL_STATUS.REJECTED && !String(reason || '').trim()) {
    throw ApiError.badRequest('A rejection reason is required');
  }
  const profile = await WorkerProfile.findById(workerId).populate('userId');
  if (!profile) throw ApiError.notFound('Worker not found');
  if (!profile.userId) throw ApiError.notFound('Worker account not found');

  profile.approvalStatus = approvalStatus;
  profile.rejectionReason = approvalStatus === APPROVAL_STATUS.REJECTED ? String(reason).trim().slice(0, 500) : '';
  profile.approvedAt = approvalStatus === APPROVAL_STATUS.APPROVED ? new Date() : null;
  await profile.save();

  if (approvalStatus === APPROVAL_STATUS.APPROVED) {
    await createNotification({
      recipientId: profile.userId._id,
      type: NOTIFICATION_TYPES.ACCOUNT_APPROVED,
      title: 'Your professional account is approved',
      message: 'Congratulations! Your WorkConnect profile is now live and customers can book your services.',
      actionUrl: '/worker',
    });
  } else {
    await createNotification({
      recipientId: profile.userId._id,
      type: NOTIFICATION_TYPES.ACCOUNT_REJECTED,
      title: 'Worker application not approved',
      message: `Your application was not approved. Reason: ${reason}`,
      actionUrl: '/worker/profile',
    });
  }

  await writeAuditLog({
    adminId,
    action: approvalStatus === APPROVAL_STATUS.APPROVED ? 'worker.approve' : 'worker.reject',
    targetType: 'worker',
    targetId: profile._id,
    description: `${approvalStatus === APPROVAL_STATUS.APPROVED ? 'Approved' : 'Rejected'} worker ${profile.userId.name} (${profile.userId.email})${reason ? ` (reason: ${reason})` : ''}`,
    metadata: { approvalStatus, reason },
    ipAddress,
  });

  return { id: String(profile._id), approvalStatus: profile.approvalStatus, rejectionReason: profile.rejectionReason };
}

async function setWorkerAccountStatus(adminId, workerId, accountStatus, reason, ipAddress) {
  if (!Object.values(ACCOUNT_STATUS).includes(accountStatus)) throw ApiError.badRequest('Invalid account status');
  const profile = await WorkerProfile.findById(workerId).populate('userId');
  if (!profile || !profile.userId) throw ApiError.notFound('Worker not found');
  if (profile.userId.accountStatus === accountStatus) {
    throw ApiError.conflict(`This worker account is already ${accountStatus}`);
  }

  profile.userId.accountStatus = accountStatus;
  profile.userId.suspensionReason = accountStatus === ACCOUNT_STATUS.SUSPENDED ? String(reason || '').trim().slice(0, 500) : '';
  if (accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    profile.userId.tokenVersion = (profile.userId.tokenVersion || 0) + 1;
  }
  await profile.userId.save();

  await createNotification({
    recipientId: profile.userId._id,
    type: accountStatus === ACCOUNT_STATUS.SUSPENDED ? NOTIFICATION_TYPES.ACCOUNT_SUSPENDED : NOTIFICATION_TYPES.SYSTEM,
    title: accountStatus === ACCOUNT_STATUS.SUSPENDED ? 'Worker account suspended' : 'Worker account reactivated',
    message:
      accountStatus === ACCOUNT_STATUS.SUSPENDED
        ? `Your worker account has been suspended${reason ? `: ${reason}` : '.'} You will not appear in search results or receive bookings.`
        : 'Your worker account has been reactivated. You can receive bookings again.',
    actionUrl: '/worker',
  });

  await writeAuditLog({
    adminId,
    action: accountStatus === ACCOUNT_STATUS.SUSPENDED ? 'worker.suspend' : 'worker.reactivate',
    targetType: 'worker',
    targetId: profile._id,
    description: `${accountStatus === ACCOUNT_STATUS.SUSPENDED ? 'Suspended' : 'Reactivated'} worker ${profile.userId.name} (${profile.userId.email})${reason ? ` (reason: ${reason})` : ''}`,
    metadata: { accountStatus, reason },
    ipAddress,
  });

  return { id: String(profile._id), accountStatus: profile.userId.accountStatus };
}

async function listCategoriesForAdmin() {
  const categories = await ServiceCategory.find().sort({ sortOrder: 1, name: 1 });
  const workerCounts = await WorkerProfile.aggregate([
    { $group: { _id: { categoryId: '$serviceCategoryId', approval: '$approvalStatus' }, count: { $sum: 1 } } },
  ]);
  const counts = new Map();
  workerCounts.forEach((row) => {
    const key = String(row._id.categoryId);
    if (!counts.has(key)) counts.set(key, { total: 0, approved: 0, pending: 0 });
    const entry = counts.get(key);
    entry.total += row.count;
    if (row._id.approval === APPROVAL_STATUS.APPROVED) entry.approved += row.count;
    if (row._id.approval === APPROVAL_STATUS.PENDING) entry.pending += row.count;
  });
  return categories.map((category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    workerCount: counts.get(String(category._id))?.total || 0,
    approvedWorkerCount: counts.get(String(category._id))?.approved || 0,
    pendingWorkerCount: counts.get(String(category._id))?.pending || 0,
    createdAt: category.createdAt,
  }));
}

async function createCategory(adminId, payload, ipAddress) {
  const name = String(payload.name || '').trim();
  if (name.length < 2) throw ApiError.badRequest('Category name must be at least 2 characters');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const existing = await ServiceCategory.findOne({ $or: [{ name: new RegExp(`^${escapeRegex(name)}$`, 'i') }, { slug }] });
  if (existing) throw ApiError.conflict('A category with this name already exists');

  const category = await ServiceCategory.create({
    name,
    slug,
    description: String(payload.description || '').trim().slice(0, 500),
    icon: String(payload.icon || 'Wrench').trim().slice(0, 50),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    sortOrder: Number(payload.sortOrder) || 0,
  });

  await writeAuditLog({
    adminId,
    action: 'category.create',
    targetType: 'category',
    targetId: category._id,
    description: `Created service category ${category.name}`,
    ipAddress,
  });
  return category;
}

async function updateCategory(adminId, categoryId, payload, ipAddress) {
  const category = await ServiceCategory.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found');

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length < 2) throw ApiError.badRequest('Category name must be at least 2 characters');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const duplicate = await ServiceCategory.findOne({
      _id: { $ne: category._id },
      $or: [{ name: new RegExp(`^${escapeRegex(name)}$`, 'i') }, { slug }],
    });
    if (duplicate) throw ApiError.conflict('A category with this name already exists');
    category.name = name;
    category.slug = slug;
  }
  if (payload.description !== undefined) category.description = String(payload.description).trim().slice(0, 500);
  if (payload.icon !== undefined) category.icon = String(payload.icon).trim().slice(0, 50);
  if (payload.sortOrder !== undefined) category.sortOrder = Number(payload.sortOrder) || 0;
  if (payload.isActive !== undefined) category.isActive = Boolean(payload.isActive);
  await category.save();

  await writeAuditLog({
    adminId,
    action: 'category.update',
    targetType: 'category',
    targetId: category._id,
    description: `Updated service category ${category.name}`,
    metadata: { isActive: category.isActive },
    ipAddress,
  });
  return category;
}

async function listBookings(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) {
    filter.bookingReference = { $regex: escapeRegex(query.search.trim().toUpperCase()), $options: 'i' };
  }
  if (query.status && Object.values(BOOKING_STATUS).includes(query.status)) filter.status = query.status;
  if (query.category) filter.serviceCategoryId = query.category;
  if (query.city) filter.city = { $regex: `^${escapeRegex(query.city.trim())}$`, $options: 'i' };
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = parseDateOnly(query.from, 'From date');
    if (query.to) {
      const end = parseDateOnly(query.to, 'To date');
      end.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  if (query.workerId && mongoose.isValidObjectId(query.workerId)) filter.workerId = query.workerId;
  if (query.customerId && mongoose.isValidObjectId(query.customerId)) filter.customerId = query.customerId;

  const [bookings, total] = await Promise.all([
    populateBooking(Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings: bookings.map((booking) => serializeBooking(booking, ROLES.ADMIN)),
    pagination: paginationMeta(total, page, limit),
  };
}

async function getBookingStatistics() {
  const statusRows = await Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const today = utcStartOfDay();
  const [todayCount, weekCount, monthCount] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: today } }),
    Booking.countDocuments({ createdAt: { $gte: addDays(today, -6) } }),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth() } }),
  ]);
  return {
    byStatus: statusRows.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {}),
    today: todayCount,
    week: weekCount,
    month: monthCount,
  };
}

async function cancelBookingAdmin(adminId, bookingId, reason, ipAddress) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if ([BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
    throw ApiError.badRequest(`A ${booking.status} booking cannot be cancelled by an administrator`);
  }
  const updated = await serializeBooking(
    await populateBooking(
      Booking.findByIdAndUpdate(
        bookingId,
        {
          $set: {
            status: BOOKING_STATUS.CANCELLED,
            cancellationReason: String(reason || '').trim().slice(0, 500) || 'Cancelled by administrator',
            cancelledBy: 'admin',
            cancelledAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: BOOKING_STATUS.CANCELLED,
              changedBy: adminId,
              note: `Cancelled by administrator: ${String(reason || '').trim() || 'No reason provided'}`,
              changedAt: new Date(),
            },
          },
        },
        { new: true }
      )
    ),
    ROLES.ADMIN
  );

  await Promise.all([
    createNotification({
      recipientId: updated.customer.id,
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      title: 'Booking cancelled by support',
      message: `An administrator cancelled your booking ${updated.bookingReference}. Reason: ${updated.cancellationReason}`,
      relatedBookingId: updated.id,
      actionUrl: `/app/bookings/${updated.id}`,
    }),
    createNotification({
      recipientId: updated.worker.id,
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      title: 'Booking cancelled by support',
      message: `An administrator cancelled booking ${updated.bookingReference}. Reason: ${updated.cancellationReason}`,
      relatedBookingId: updated.id,
      actionUrl: `/worker/bookings/${updated.id}`,
    }),
    writeAuditLog({
      adminId,
      action: 'booking.cancel',
      targetType: 'booking',
      targetId: bookingId,
      description: `Cancelled booking ${updated.bookingReference}`,
      metadata: { reason },
      ipAddress,
    }),
  ]);

  return getBookingById(bookingId, { role: ROLES.ADMIN, _id: adminId });
}

async function listAuditLogs(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.targetType) filter.targetType = query.targetType;
  const [logs, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminAuditLog.countDocuments(filter),
  ]);
  return {
    logs: logs.map((log) => ({
      id: String(log._id),
      admin: log.adminId ? { id: String(log.adminId._id), name: log.adminId.name, email: log.adminId.email } : null,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      description: log.description,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    })),
    pagination: paginationMeta(total, page, limit),
  };
}

module.exports = {
  getDashboard,
  listUsers,
  getUserDetail,
  setUserStatus,
  listWorkers,
  getWorkerAdminDetail,
  setWorkerApproval,
  setWorkerAccountStatus,
  listCategoriesForAdmin,
  createCategory,
  updateCategory,
  listBookings,
  getBookingStatistics,
  cancelBookingAdmin,
  listAuditLogs,
  writeAuditLog,
};
