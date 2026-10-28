const mongoose = require('mongoose');
const { BOOKING_STATUS, ACTIVE_BOOKING_STATUSES } = require('../utils/constants');

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(BOOKING_STATUS), required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerProfile',
      required: true,
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
      index: true,
    },
    serviceDescription: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
      minlength: [10, 'Please describe the problem in at least 10 characters'],
      maxlength: [2000, 'Service description is too long'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Appointment time must be in HH:MM format'],
    },
    serviceAddress: {
      type: String,
      required: [true, 'Service address is required'],
      trim: true,
      maxlength: 300,
    },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    locality: { type: String, required: true, trim: true, maxlength: 120 },
    customerName: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    additionalNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: '' },
    cancellationReason: { type: String, trim: true, maxlength: 500, default: '' },
    cancelledBy: {
      type: String,
      enum: ['customer', 'worker', 'admin', ''],
      default: '',
    },
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ workerId: 1, status: 1, appointmentDate: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ appointmentDate: 1, status: 1 });
bookingSchema.index({ city: 1, createdAt: -1 });
// Prevent double-booking the same worker for the same slot while a booking is active.
bookingSchema.index(
  { workerId: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ACTIVE_BOOKING_STATUSES } },
    name: 'unique_active_worker_slot',
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
