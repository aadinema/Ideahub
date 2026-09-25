/**
 * server/models/DepartmentTarget.js
 * Annual / per-event idea submission targets per department.
 * Compound unique ensures no duplicate target for the same dept+FY+event+type.
 *
 * FRD §9, Master Prompt §4.8
 */
const mongoose = require('mongoose');
const { ALL_TARGET_TYPES } = require('../../shared/constants');

const departmentTargetSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    // e.g. "FY2026-27" — April 1 start (India standard, confirmed)
    financialYear: {
      type: String,
      required: [true, 'Financial year is required'],
      match: [/^FY\d{4}-\d{2}$/, 'Financial year format must be FY2026-27'],
    },
    // null = annual target (not event-specific)
    ideathonEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IdeathonEvent',
      default: null,
    },
    targetType: {
      type: String,
      enum: ALL_TARGET_TYPES,
      required: [true, 'Target type is required'],
    },
    targetValue: {
      type: Number,
      required: [true, 'Target value is required'],
      min: [1, 'Target must be at least 1'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique: no duplicate target for same dept+FY+event+type
departmentTargetSchema.index(
  { department: 1, financialYear: 1, ideathonEventId: 1, targetType: 1 },
  { unique: true }
);
departmentTargetSchema.index({ department: 1, financialYear: 1 });

module.exports = mongoose.model('DepartmentTarget', departmentTargetSchema);
