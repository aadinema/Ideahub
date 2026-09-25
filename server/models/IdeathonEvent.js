/**
 * server/models/IdeathonEvent.js
 * Ideathon and related event collection.
 *
 * FRD §7, Master Prompt §4.5
 */
const mongoose = require('mongoose');
const {
  ALL_EVENT_TYPES,
  ALL_EVENT_VISIBILITIES,
  ALL_EVENT_STATUSES,
  EVENT_STATUS,
  EVENT_VISIBILITY,
} = require('../../shared/constants');

const extensionHistorySchema = new mongoose.Schema(
  {
    newEndDate:  { type: Date, required: true },
    justification: { type: String, required: true, minlength: [20, 'Justification too short'] },
    extendedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const ideathonEventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [300, 'Event name too long'],
    },
    theme: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ALL_EVENT_TYPES,
      required: [true, 'Event type is required'],
    },
    initiative: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    // Departments targeted for restricted events
    targetDepartments: [{ type: String, trim: true }],
    maxParticipants: {
      type: Number,
      min: [1, 'Must allow at least 1 participant'],
      default: null, // null = unlimited
    },
    ideaCategory: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ALL_EVENT_VISIBILITIES,
      default: EVENT_VISIBILITY.DRAFT,
    },
    // Registered participants
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ALL_EVENT_STATUSES,
      default: EVENT_STATUS.DRAFT,
    },
    // Append-only extension history — FR-IE-07
    extensionHistory: [extensionHistorySchema],

    // Configurable min qualifying score threshold — FRD §8.2
    minQualifyingScore: {
      type: Number,
      default: 6.0,
      min: 0,
      max: 10,
    },

    // Quorum configuration for committee voting on ideas linked to this event
    quorumType: {
      type: String,
      enum: ['majority', 'fixed_count'],
      default: 'majority',
    },
    quorumValue: {
      type: Number,
      default: null, // only used when quorumType === 'fixed_count'
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Validation: endDate must be >= startDate
ideathonEventSchema.pre('validate', function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    throw new Error('End date must be on or after start date (FR-IE-01)');
  }
});

// Indexes — Master Prompt §10
ideathonEventSchema.index({ status: 1 });
ideathonEventSchema.index({ startDate: 1 });
ideathonEventSchema.index({ endDate: 1 });
ideathonEventSchema.index({ visibility: 1 });
ideathonEventSchema.index({ targetDepartments: 1 });
ideathonEventSchema.index({ eventType: 1 });

module.exports = mongoose.model('IdeathonEvent', ideathonEventSchema);
