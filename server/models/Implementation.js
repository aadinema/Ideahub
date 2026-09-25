/**
 * server/models/Implementation.js
 * Implementation tracking record — created when Innovation Committee
 * approves an idea for implementation and assigns an owner.
 *
 * FRD FR-07, Master Prompt §4.6
 */
const mongoose = require('mongoose');
const { ALL_MILESTONE_STATUSES, MILESTONE_STATUS } = require('../../shared/constants');

const milestoneSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    targetDate:  { type: Date, required: true },
    status:      { type: String, enum: ALL_MILESTONE_STATUSES, default: MILESTONE_STATUS.PENDING },
    completedAt: { type: Date, default: null },
    notes:       { type: String, default: '' },
  },
  { _id: true, timestamps: false }
);

const implementationSchema = new mongoose.Schema(
  {
    ideaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
      unique: true, // one implementation record per idea
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    targetCompletionDate: {
      type: Date,
      required: true,
    },
    // Progress slider 0–100 — FR-07-01
    progressPercent: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%'],
    },
    milestones: [milestoneSchema],

    // Whether the 3-day completion reminder has been sent — FR-07-03
    completionReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Validation: targetCompletionDate must be >= startDate
implementationSchema.pre('validate', function () {
  if (this.startDate && this.targetCompletionDate && this.targetCompletionDate < this.startDate) {
    throw new Error('Target completion date must be on or after start date');
  }
});

// Indexes
implementationSchema.index({ ownerId: 1 });
implementationSchema.index({ ideaId: 1 }, { unique: true });
implementationSchema.index({ targetCompletionDate: 1, completionReminderSent: 1 });

module.exports = mongoose.model('Implementation', implementationSchema);
