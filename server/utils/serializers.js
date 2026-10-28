const { ROLES } = require('./constants');

function publicUser(user) {
  if (!user) return null;
  const doc = user.toObject ? user.toObject() : user;
  return {
    id: String(doc._id || doc.id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    role: doc.role,
    city: doc.city || '',
    locality: doc.locality || '',
    accountStatus: doc.accountStatus,
    createdAt: doc.createdAt,
  };
}

function publicWorkerProfile(profile) {
  if (!profile) return null;
  const doc = profile.toObject ? profile.toObject() : profile;
  return {
    id: String(doc._id),
    userId: String(doc.userId && doc.userId._id ? doc.userId._id : doc.userId),
    name: doc.userId && doc.userId.name ? doc.userId.name : undefined,
    email: doc.userId && doc.userId.email ? doc.userId.email : undefined,
    phone: doc.userId && doc.userId.phone ? doc.userId.phone : undefined,
    profession: doc.serviceCategoryId && doc.serviceCategoryId.name
      ? doc.serviceCategoryId.name
      : undefined,
    serviceCategoryId: doc.serviceCategoryId && doc.serviceCategoryId._id
      ? String(doc.serviceCategoryId._id)
      : String(doc.serviceCategoryId),
    additionalServices: (doc.additionalServices || []).map((service) =>
      service && service.name ? { id: String(service._id), name: service.name } : String(service)
    ),
    experienceYears: doc.experienceYears,
    description: doc.description,
    profileImage: doc.profileImage,
    city: doc.city,
    locality: doc.locality,
    serviceAreas: doc.serviceAreas,
    serviceCharge: doc.serviceCharge,
    availability: doc.availability,
    approvalStatus: doc.approvalStatus,
    averageRating: doc.averageRating,
    totalReviews: doc.totalReviews,
    completedJobs: doc.completedJobs,
    createdAt: doc.createdAt,
  };
}

/**
 * Information a worker needs to fulfil a booking. Other customers' data is never
 * exposed through this helper.
 */
function bookingForWorker(booking) {
  const doc = booking.toObject ? booking.toObject() : booking;
  return {
    ...doc,
    customer: doc.customerId && doc.customerId.name
      ? {
          id: String(doc.customerId._id),
          name: doc.customerId.name,
          phone: doc.customerId.phone,
          city: doc.customerId.city,
          locality: doc.customerId.locality,
        }
      : undefined,
  };
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { publicUser, publicWorkerProfile, bookingForWorker, escapeRegex, ROLES };
