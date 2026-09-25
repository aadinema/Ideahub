/**
 * server/models/EvaluationCriteria.js
 * Admin-configurable, versioned evaluation criteria.
 *
 * Key invariants:
 * - Weights must always sum to 100% for a given ideathonEventId (or global set).
 *   Enforced at the service level (not schema, since sum requires cross-doc check).
 * - Changes are versioned: historical evaluations retain the criteria set that was
 *   active at time of scoring.
 * - Default 9 criteria from FRD §8.1 must be seeded (see /server/seed/).
 *
 * FRD §8, Master Prompt §4.4
 */
const mongoose = require('mongoose');

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    // null = global default; ObjectId = event-specific override
    ideathonEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IdeathonEvent',
      default: null,
    },
    criterionName: {
      type: String,
      required: [true, 'Criterion name is required'],
      trim: true,
      maxlength: [200, 'Criterion name too long'],
    },
    // Weight as a decimal percentage, e.g. 0.15 for 15%
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight cannot be negative'],
      max: [1, 'Weight cannot exceed 1 (100%)'],
    },
    scoreRangeMin: {
      type: Number,
      default: 1,
    },
    scoreRangeMax: {
      type: Number,
      default: 10,
    },
    // Scoring guidance text shown to evaluators
    guidance: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Auto-incremented version for change tracking
    version: {
      type: Number,
      default: 1,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
evaluationCriteriaSchema.index({ ideathonEventId: 1, isActive: 1 });
evaluationCriteriaSchema.index({ version: 1 });

module.exports = mongoose.model('EvaluationCriteria', evaluationCriteriaSchema);
