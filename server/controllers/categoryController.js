const asyncHandler = require('../utils/asyncHandler');
const ServiceCategory = require('../models/ServiceCategory');
const WorkerProfile = require('../models/WorkerProfile');
const { APPROVAL_STATUS } = require('../utils/constants');

const listActiveCategories = asyncHandler(async (_req, res) => {
  const categories = await ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  const counts = await WorkerProfile.aggregate([
    { $match: { approvalStatus: APPROVAL_STATUS.APPROVED } },
    { $group: { _id: '$serviceCategoryId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  res.json({
    success: true,
    data: {
      categories: categories.map((category) => ({
        id: String(category._id),
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        workerCount: countMap.get(String(category._id)) || 0,
      })),
    },
  });
});

module.exports = { listActiveCategories };
