const mongoose = require('mongoose');
const { APPROVAL_STATUS, WEEK_DAYS } = require('../utils/constants');

const availabilitySchema = new mongoose.Schema(
  {
    days: {
      type: [{ type: String, enum: WEEK_DAYS }],
      default: WEEK_DAYS.slice(1),
    },
    startTime: {
      type: String,
      default: '09:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      default: '18:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format'],
    },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const workerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: [true, 'Primary profession is required'],
      index: true,
    },
    additionalServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
      },
    ],
    experienceYears: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience value is too high'],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1200, 'Description is too long'],
      default: '',
    },
    profileImage: { type: String, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    locality: { type: String, required: true, trim: true, maxlength: 120 },
    serviceAreas: [{ type: String, trim: true, maxlength: 120 }],
    serviceCharge: {
      type: Number,
      required: [true, 'Expected service charge is required'],
      min: [0, 'Service charge cannot be negative'],
      max: [1000000, 'Service charge is too high'],
    },
    availability: { type: availabilitySchema, default: () => ({}) },
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: '' },
    approvedAt: { type: Date, default: null },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, min: 0, default: 0 },
    completedJobs: { type: Number, min: 0, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

workerProfileSchema.index({ approvalStatus: 1, city: 1, serviceCategoryId: 1 });
workerProfileSchema.index({ approvalStatus: 1, averageRating: -1 });
workerProfileSchema.index({ city: 'text', locality: 'text', description: 'text' });

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
