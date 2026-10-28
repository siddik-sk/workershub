const mongoose = require('mongoose');
const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const ServiceCategory = require('../models/ServiceCategory');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const {
  ROLES,
  ACCOUNT_STATUS,
  APPROVAL_STATUS,
  BOOKING_STATUS,
  WEEK_DAYS,
} = require('../utils/constants');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { escapeRegex } = require('../utils/serializers');
const { parseDateOnly, utcStartOfDay, weekdayName } = require('../utils/dates');
const { getUpcomingForWorker, serializeBooking, populateBooking } = require('./bookingService');

function buildPublicWorker(rawProfile) {
  const profile = rawProfile.toObject ? rawProfile.toObject() : rawProfile;
  const user = profile.user || profile.userId || {};
  const category = profile.serviceCategoryId || {};
  return {
    id: String(profile._id),
    userId: String(user._id || profile.userId),
    name: user.name || 'Professional',
    city: profile.city,
    locality: profile.locality,
    serviceAreas: profile.serviceAreas || [],
    profession: category.name || '',
    professionSlug: category.slug || '',
    categoryId: String(category._id || profile.serviceCategoryId),
    categoryIcon: category.icon || 'Wrench',
    additionalServices: (profile.additionalServices || [])
      .filter((service) => service && service.name)
      .map((service) => ({ id: String(service._id), name: service.name, slug: service.slug })),
    experienceYears: profile.experienceYears,
    description: profile.description,
    profileImage: profile.profileImage,
    serviceCharge: profile.serviceCharge,
    availability: profile.availability,
    averageRating: profile.averageRating,
    totalReviews: profile.totalReviews,
    completedJobs: profile.completedJobs,
    createdAt: profile.createdAt,
  };
}

async function searchWorkers(query) {
  const { page, limit, skip } = getPagination(query);
  const profileMatch = { approvalStatus: APPROVAL_STATUS.APPROVED };

  const categoryKey = query.profession || query.category;
  if (categoryKey) {
    let category = null;
    if (mongoose.isValidObjectId(categoryKey)) {
      category = await ServiceCategory.findById(categoryKey);
    } else {
      category = await ServiceCategory.findOne({ slug: String(categoryKey).toLowerCase() });
    }
    if (!category) {
      return { workers: [], pagination: paginationMeta(0, page, limit) };
    }
    profileMatch.$or = [
      { serviceCategoryId: category._id },
      { additionalServices: category._id },
    ];
  }

  if (query.city) profileMatch.city = { $regex: `^${escapeRegex(query.city.trim())}$`, $options: 'i' };
  if (query.locality) profileMatch.locality = { $regex: escapeRegex(query.locality.trim()), $options: 'i' };
  if (query.minExperience) profileMatch.experienceYears = { $gte: Number(query.minExperience) || 0 };
  if (query.maxPrice) profileMatch.serviceCharge = { $lte: Number(query.maxPrice) || 0 };
  if (query.minRating) profileMatch.averageRating = { $gte: Number(query.minRating) || 0 };
  if (query.available === 'true' || query.availability === 'today') {
    profileMatch['availability.isAvailable'] = true;
  }
  if (query.day && WEEK_DAYS.includes(String(query.day).toLowerCase())) {
    profileMatch['availability.days'] = String(query.day).toLowerCase();
    profileMatch['availability.isAvailable'] = true;
  }

  const userMatch = { 'user.accountStatus': ACCOUNT_STATUS.ACTIVE, 'user.role': ROLES.WORKER };
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    userMatch.$or = [{ 'user.name': regex }, { description: regex }, { city: regex }, { locality: regex }];
  }

  let sort = { averageRating: -1, totalReviews: -1, createdAt: -1 };
  if (query.sort === 'price_low') sort = { serviceCharge: 1, averageRating: -1 };
  if (query.sort === 'price_high') sort = { serviceCharge: -1, averageRating: -1 };
  if (query.sort === 'experience') sort = { experienceYears: -1, averageRating: -1 };
  if (query.sort === 'rating') sort = { averageRating: -1, totalReviews: -1 };
  if (query.sort === 'newest') sort = { createdAt: -1 };

  const pipeline = [
    { $match: profileMatch },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              name: 1,
              city: 1,
              locality: 1,
              accountStatus: 1,
              role: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    { $unwind: '$user' },
    { $match: userMatch },
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'serviceCategoryId',
        foreignField: '_id',
        as: 'serviceCategoryId',
      },
    },
    { $unwind: { path: '$serviceCategoryId', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'additionalServices',
        foreignField: '_id',
        as: 'additionalServices',
      },
    },
    { $sort: sort },
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
    workers: (result?.items || []).map(buildPublicWorker),
    pagination: paginationMeta(total, page, limit),
  };
}

async function getFeaturedWorkers(limit = 6) {
  const profiles = await WorkerProfile.aggregate([
    { $match: { approvalStatus: APPROVAL_STATUS.APPROVED } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          { $match: { accountStatus: ACCOUNT_STATUS.ACTIVE, role: ROLES.WORKER } },
          { $project: { name: 1, city: 1, locality: 1, createdAt: 1 } },
        ],
      },
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'serviceCategoryId',
        foreignField: '_id',
        as: 'serviceCategoryId',
      },
    },
    { $unwind: { path: '$serviceCategoryId', preserveNullAndEmptyArrays: true } },
    { $sort: { isFeatured: -1, averageRating: -1, completedJobs: -1, createdAt: -1 } },
    { $limit: limit },
  ]);
  return profiles.map(buildPublicWorker);
}

async function getPublicWorker(workerProfileId) {
  if (!mongoose.isValidObjectId(workerProfileId)) throw ApiError.notFound('Professional not found');
  const profile = await WorkerProfile.findOne({
    _id: workerProfileId,
    approvalStatus: APPROVAL_STATUS.APPROVED,
  })
    .populate('userId', 'name city locality accountStatus role createdAt')
    .populate('serviceCategoryId')
    .populate('additionalServices');

  if (!profile || !profile.userId || profile.userId.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw ApiError.notFound('Professional not found');
  }

  const reviews = await Review.find({ workerId: profile.userId._id })
    .populate('customerId', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

  return {
    worker: buildPublicWorker(profile),
    reviews: reviews.map((review) => ({
      id: String(review._id),
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerId?.name
        ? review.customerId.name.split(' ')[0] + ' ' + (review.customerId.name.split(' ')[1]?.[0] || '')
        : 'Customer',
      createdAt: review.createdAt,
    })),
  };
}

async function getWorkerProfileForOwner(userId) {
  const profile = await WorkerProfile.findOne({ userId })
    .populate('serviceCategoryId')
    .populate('additionalServices');
  if (!profile) throw ApiError.notFound('Worker profile not found');
  return profile;
}

function calculateProfileCompletion(user, profile) {
  const checks = [
    Boolean(user.name),
    Boolean(user.phone),
    Boolean(profile.city && profile.locality),
    Boolean(profile.serviceCategoryId),
    Boolean(profile.description && profile.description.length >= 30),
    Boolean(profile.profileImage),
    Number(profile.serviceCharge) >= 0,
    Number(profile.experienceYears) >= 0,
    (profile.serviceAreas || []).length > 0,
    Boolean(profile.availability?.days?.length),
    Boolean(profile.availability?.startTime && profile.availability?.endTime),
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

async function getWorkerDashboard(userId) {
  const [user, profile] = await Promise.all([
    User.findById(userId),
    WorkerProfile.findOne({ userId })
      .populate('serviceCategoryId')
      .populate('additionalServices'),
  ]);
  if (!user || !profile) throw ApiError.notFound('Worker profile not found');

  const [statusCounts, totalRequests, upcoming, recent] = await Promise.all([
    Booking.aggregate([
      { $match: { workerId: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.countDocuments({ workerId: user._id }),
    getUpcomingForWorker(user._id, 5),
    populateBooking(
      Booking.find({ workerId: user._id }).sort({ createdAt: -1 }).limit(5)
    ),
  ]);

  const counts = Object.values(BOOKING_STATUS).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  statusCounts.forEach((item) => {
    counts[item._id] = item.count;
  });

  return {
    stats: {
      totalRequests,
      pending: counts.pending,
      accepted: counts.accepted,
      inProgress: counts.in_progress,
      completed: counts.completed,
      rejected: counts.rejected,
      cancelled: counts.cancelled,
      estimatedEarnings: counts.completed * Number(profile.serviceCharge || 0),
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      completedJobs: profile.completedJobs,
    },
    approvalStatus: profile.approvalStatus,
    rejectionReason: profile.rejectionReason,
    profileCompletion: calculateProfileCompletion(user, profile),
    upcoming,
    recentBookings: recent.map((booking) => serializeBooking(booking, ROLES.WORKER)),
    profile: {
      id: String(profile._id),
      profession: profile.serviceCategoryId?.name || '',
      serviceCharge: profile.serviceCharge,
      city: profile.city,
      locality: profile.locality,
      availability: profile.availability,
      profileImage: profile.profileImage,
    },
  };
}

async function updateWorkerProfile(userId, payload, file) {
  const [user, profile] = await Promise.all([
    User.findById(userId),
    WorkerProfile.findOne({ userId }),
  ]);
  if (!user || !profile) throw ApiError.notFound('Worker profile not found');

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length < 2) throw ApiError.badRequest('Name must be at least 2 characters');
    user.name = name;
  }
  if (payload.phone !== undefined) {
    const phone = String(payload.phone).trim();
    if (!/^[+0-9()\-\s]{7,25}$/.test(phone)) throw ApiError.badRequest('Enter a valid phone number');
    user.phone = phone;
  }
  if (payload.city !== undefined) {
    const city = String(payload.city).trim();
    if (!city) throw ApiError.badRequest('City is required');
    user.city = city;
    profile.city = city;
  }
  if (payload.locality !== undefined) {
    const locality = String(payload.locality).trim();
    if (!locality) throw ApiError.badRequest('Locality is required');
    user.locality = locality;
    profile.locality = locality;
  }

  if (payload.profession !== undefined) {
    const category = await ServiceCategory.findOne({ _id: payload.profession, isActive: true });
    if (!category) throw ApiError.badRequest('Please choose a valid active profession');
    profile.serviceCategoryId = category._id;
  }

  if (payload.additionalServices !== undefined) {
    let ids = payload.additionalServices;
    if (typeof ids === 'string') {
      try {
        ids = JSON.parse(ids);
      } catch {
        ids = ids.split(',');
      }
    }
    if (!Array.isArray(ids)) ids = [];
    ids = ids.filter((id) => mongoose.isValidObjectId(id)).map(String);
    const categories = await ServiceCategory.find({ _id: { $in: ids }, isActive: true }).select('_id');
    if (categories.length !== new Set(ids).size) {
      throw ApiError.badRequest('One or more additional services are invalid');
    }
    profile.additionalServices = categories.map((category) => category._id);
  }

  if (payload.experienceYears !== undefined) {
    const years = Number(payload.experienceYears);
    if (!Number.isFinite(years) || years < 0 || years > 60) {
      throw ApiError.badRequest('Experience must be between 0 and 60 years');
    }
    profile.experienceYears = years;
  }
  if (payload.description !== undefined) {
    profile.description = String(payload.description).trim().slice(0, 1200);
  }
  if (payload.serviceCharge !== undefined) {
    const charge = Number(payload.serviceCharge);
    if (!Number.isFinite(charge) || charge < 0) throw ApiError.badRequest('Service charge must be a positive number');
    profile.serviceCharge = charge;
  }
  if (payload.serviceAreas !== undefined) {
    let areas = payload.serviceAreas;
    if (typeof areas === 'string') {
      try {
        areas = JSON.parse(areas);
      } catch {
        areas = areas.split(',');
      }
    }
    if (!Array.isArray(areas)) areas = [];
    profile.serviceAreas = areas.map((area) => String(area).trim()).filter(Boolean).slice(0, 12);
  }
  if (file) profile.profileImage = `/uploads/${file.filename}`;

  await Promise.all([user.save(), profile.save()]);
  const refreshed = await WorkerProfile.findById(profile._id)
    .populate('serviceCategoryId')
    .populate('additionalServices');
  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      locality: user.locality,
    },
    profile: refreshed,
  };
}

async function updateAvailability(userId, payload) {
  const profile = await WorkerProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Worker profile not found');

  let days = payload.days;
  if (!Array.isArray(days)) days = profile.availability?.days || [];
  days = days.map((day) => String(day).toLowerCase()).filter((day) => WEEK_DAYS.includes(day));
  if (!days.length) throw ApiError.badRequest('Select at least one working day');

  const startTime = payload.startTime || profile.availability?.startTime || '09:00';
  const endTime = payload.endTime || profile.availability?.endTime || '18:00';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
    throw ApiError.badRequest('Working hours must be in HH:MM format');
  }
  if (startTime >= endTime) throw ApiError.badRequest('End time must be after start time');

  profile.availability = {
    days,
    startTime,
    endTime,
    isAvailable: payload.isAvailable !== undefined ? Boolean(payload.isAvailable) : true,
  };
  await profile.save();
  return profile.availability;
}

async function getWorkerPublicStats(workerProfileId) {
  if (!mongoose.isValidObjectId(workerProfileId)) throw ApiError.notFound('Professional not found');
  const profile = await WorkerProfile.findById(workerProfileId);
  if (!profile) throw ApiError.notFound('Professional not found');
  return profile;
}

module.exports = {
  searchWorkers,
  getFeaturedWorkers,
  getPublicWorker,
  getWorkerProfileForOwner,
  getWorkerDashboard,
  updateWorkerProfile,
  updateAvailability,
  calculateProfileCompletion,
  buildPublicWorker,
  getWorkerPublicStats,
};
