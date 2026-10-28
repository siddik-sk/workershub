const asyncHandler = require('../utils/asyncHandler');
const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const ServiceCategory = require('../models/ServiceCategory');
const { APPROVAL_STATUS, ACCOUNT_STATUS, BOOKING_STATUS, ROLES } = require('../utils/constants');

const publicStats = asyncHandler(async (_req, res) => {
  const [workerRows, totalCustomers, completedBookings, totalReviews, ratingAgg, activeCategories] =
    await Promise.all([
      WorkerProfile.aggregate([
        { $match: { approvalStatus: APPROVAL_STATUS.APPROVED } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              { $match: { accountStatus: ACCOUNT_STATUS.ACTIVE, role: ROLES.WORKER } },
              { $project: { _id: 1 } },
            ],
          },
        },
        { $unwind: '$user' },
        { $count: 'count' },
      ]),
      User.countDocuments({ role: ROLES.CUSTOMER, accountStatus: ACCOUNT_STATUS.ACTIVE }),
      Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED }),
      Review.countDocuments(),
      Review.aggregate([{ $group: { _id: null, average: { $avg: '$rating' } } }]),
      ServiceCategory.countDocuments({ isActive: true }),
    ]);

  const reviews = await Review.find()
    .populate('workerId', 'name')
    .populate('customerId', 'name')
    .sort({ createdAt: -1 })
    .limit(6);

  const workerIds = reviews.map((review) => review.workerId?._id).filter(Boolean);
  const profiles = await WorkerProfile.find({ userId: { $in: workerIds } }).populate(
    'serviceCategoryId',
    'name'
  );
  const professionMap = new Map(
    profiles.map((profile) => [String(profile.userId), profile.serviceCategoryId?.name || 'Local service'])
  );

  res.json({
    success: true,
    data: {
      approvedWorkers: workerRows[0]?.count || 0,
      customers: totalCustomers,
      completedBookings,
      totalReviews,
      averageRating: ratingAgg[0]?.average ? Math.round(ratingAgg[0].average * 10) / 10 : 0,
      activeCategories,
      recentReviews: reviews.map((review) => ({
        id: String(review._id),
        rating: review.rating,
        comment: review.comment,
        workerName: review.workerId?.name || 'Professional',
        profession: professionMap.get(String(review.workerId?._id)) || '',
        customerName: review.customerId?.name
          ? `${review.customerId.name.split(' ')[0]} ${(review.customerId.name.split(' ')[1] || '').slice(0, 1)}`.trim()
          : 'Customer',
        createdAt: review.createdAt,
      })),
    },
  });
});

module.exports = { publicStats };
