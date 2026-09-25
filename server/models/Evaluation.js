/**
 * server/models/Evaluation.js
 * Per-evaluator scoring record for an idea.
 *
 * Key invariants:
 * - One document per (ideaId, evaluatorId) pair — compound unique index.
 * - scores[] is bound to active EvaluationCriteria at time of scoring.
 * - weightedTotal is computed in pre-save hook (score × weight, summed).
 * - Average across evaluators is computed at query time (aggregation pipeline),
 *   not stored — prevents stale data on criteria change.
 * - Shortlisting requires ≥2 evaluator scores (enforced in workflowService).
 *
 * FRD FR-04, §8, Master Prompt §4.3
 */
const mongoose = require('mongoose');
const { ALL_EVALUATION_DECISIONS } = require('../../shared/constants');

const scoreEntrySchema = new mongoose.Schema(
  {
    criterion:  { type: String, required: true },
    criteriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationCriteria' },
    score:      { type: Number, required: true, min: 1, max: 10 },
    weight:     { type: Number, required: true }, // captured at time of evaluation
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    ideaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
    },
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Snapshot of scores against criteria active at evaluation time
    scores: {
      type: [scoreEntrySchema],
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: 'At least one score entry is required',
      },
    },
    // Computed pre-save: Σ(score × weight)
    weightedTotal: {
      type: Number,
      default: 0,
    },
    comments: {
      type: String,
      required: [true, 'Evaluator comments are required'],
      minlength: [10, 'Comments must be at least 10 characters'],
    },
    decision: {
      type: String,
      enum: ALL_EVALUATION_DECISIONS,
      required: [true, 'Decision is required'],
    },
    // Version of criteria set used — for audit trail
    criteriaVersion: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Compound unique: one submission per evaluator per idea
evaluationSchema.index({ ideaId: 1, evaluatorId: 1 }, { unique: true });
evaluationSchema.index({ ideaId: 1 });
evaluationSchema.index({ evaluatorId: 1 });

// Pre-save: compute weightedTotal
evaluationSchema.pre('save', function () {
  if (this.scores && this.scores.length > 0) {
    this.weightedTotal = this.scores.reduce(
      (sum, entry) => sum + entry.score * entry.weight,
      0
    );
    // Round to 2 decimal places
    this.weightedTotal = Math.round(this.weightedTotal * 100) / 100;
  }
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
