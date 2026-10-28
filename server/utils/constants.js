const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  WORKER: 'worker',
  ADMIN: 'admin',
});

const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
});

const APPROVAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const BOOKING_TRANSITIONS = Object.freeze({
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
});

const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.IN_PROGRESS,
];

const NOTIFICATION_TYPES = Object.freeze({
  BOOKING_NEW: 'booking_new',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_REJECTED: 'booking_rejected',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_IN_PROGRESS: 'booking_in_progress',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_REVIEW: 'booking_review',
  ACCOUNT_APPROVED: 'account_approved',
  ACCOUNT_REJECTED: 'account_rejected',
  ACCOUNT_SUSPENDED: 'account_suspended',
  SYSTEM: 'system',
});

const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

module.exports = {
  ROLES,
  ACCOUNT_STATUS,
  APPROVAL_STATUS,
  BOOKING_STATUS,
  BOOKING_TRANSITIONS,
  ACTIVE_BOOKING_STATUSES,
  NOTIFICATION_TYPES,
  WEEK_DAYS,
};
