/**
 * server/models/Benefit.js
 * Benefit realization record — created after implementation reaches 100%.
 *
 * Key invariants:
 * - Evidence attachment is mandatory when any financial amount > ₹1 Lakh (₹100,000)
 *   Enforced at controller level (not schema — requires accessing field values).
 * - endorsementStatus starts as 'pending'; committee endorses or disputes.
 * - Disputed benefits route to Finance reviewer stub (Phase 2 full workflow).
 *
 * FRD FR-08, Master Prompt §4.7
 */
const mongoose = require('mongoose');
const {
  ALL_ENDORSEMENT_STATUSES,
  ENDORSEMENT_STATUS,
} = require('../../shared/constants');

const evidenceAttachmentSchema = new mongoose.Schema(
  {
    fileName:  { type: String, required: true },
    url:       { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedAt:{ type: Date, default: Date.now },
  },
  { _id: false }
);

const benefitSchema = new mongoose.Schema(
  {
    ideaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
    },
    implementationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Implementation',
      required: true,
    },

    // Financial benefits — FR-08-01
    financial: {
      costSavingsINR:     { type: Number, default: 0, min: 0 },
      revenueIncreaseINR: { type: Number, default: 0, min: 0 },
      evidenceAttachments: [evidenceAttachmentSchema],
    },

    // Operational benefits — FR-08-02
    operational: {
      efficiencyImprovementPct: {
        type: Number,
        default: 0,
        min: [0, 'Must be 0-100'],
        max: [100, 'Must be 0-100'],
      },
      productivityGainPct: {
        type: Number,
        default: 0,
        min: [0, 'Must be 0-100'],
        max: [100, 'Must be 0-100'],
      },
      description: {
        type: String,
        default: '',
        // minlength enforced at controller level: 50 chars required — FR-08-02
      },
    },

    // Strategic benefits — FR-08-03 (SHOULD HAVE)
    strategic: {
      customerSatisfactionChange: { type: Number, default: null },
      innovationImpactRating: {
        type: Number,
        default: null,
        min: [1, 'Rating must be 1-10'],
        max: [10, 'Rating must be 1-10'],
      },
    },

    // Endorsement workflow — FR-08-05
    endorsementStatus: {
      type: String,
      enum: ALL_ENDORSEMENT_STATUSES,
      default: ENDORSEMENT_STATUS.PENDING,
    },
    disputeReason: {
      type: String,
      default: '',
    },
    // Finance reviewer stub — Phase 2 full workflow
    routedToFinanceAt: {
      type: Date,
      default: null,
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
benefitSchema.index({ ideaId: 1 });
benefitSchema.index({ implementationId: 1 });
benefitSchema.index({ endorsementStatus: 1 });

module.exports = mongoose.model('Benefit', benefitSchema);
