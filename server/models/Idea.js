/**
 * server/models/Idea.js
 * Core idea collection — the central entity of the entire platform.
 *
 * Key invariants:
 * - ideaId is human-readable (IDEA-YYYY-NNNN), generated atomically via Counter.
 * - status must only advance through STATUS_TRANSITIONS (enforced in workflowService).
 * - statusHistory is append-only; never remove or update existing entries.
 * - Every status transition also writes to AuditLog (enforced at controller level).
 * - isDraftAutoSaved tracks whether the current version is an unsaved auto-save.
 *
 * FRD FR-02, §5.2, Master Prompt §4.2
 */
const mongoose = require('mongoose');
const {
  ALL_IDEA_STATUSES,
  IDEA_STATUS,
  ALL_BENEFIT_TYPES,
} = require('../../shared/constants');

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------
const attachmentSchema = new mongoose.Schema(
  {
    fileName:   { type: String, required: true },
    url:        { type: String, required: true }, // StorageProvider URL
    mimeType:   { type: String, required: true },
    sizeBytes:  { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, enum: ALL_IDEA_STATUSES, required: true },
    actor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment:   { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------
const ideaSchema = new mongoose.Schema(
  {
    // Human-readable, auto-incremented, concurrency-safe via Counter model
    ideaId: {
      type: String,
      unique: true,
      // Set by pre-save hook using Counter.nextSequence
    },

    // Section FR-02-01
    title: {
      type: String,
      required: [true, 'Idea title is required'],
      trim: true,
      maxlength: [300, 'Title must be 300 characters or fewer'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    ideaType: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    initiative: {
      type: String,
      trim: true,
    },
    keywords: [{ type: String, trim: true }],

    // Section FR-02-02 — rich-text fields (stored as HTML strings from react-quill)
    problemStatement: {
      type: String,
      required: [true, 'Problem statement is required'],
      minlength: [50, 'Problem statement must be at least 50 characters (FR-02-02)'],
    },
    currentChallenges: { type: String, default: '' },
    proposedSolution:  { type: String, default: '' },
    innovationDescription: { type: String, default: '' },
    expectedOutcome:   { type: String, default: '' },

    // Section FR-02-03 — at least one required (enforced at controller level)
    benefitTypes: {
      type: [{ type: String, enum: ALL_BENEFIT_TYPES }],
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: 'At least one benefit type is required (FR-02-03)',
      },
    },

    // Section FR-02-04
    attachments: {
      type: [attachmentSchema],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'Maximum 5 attachments allowed (FR-02-04)',
      },
    },

    // Section FR-02-07
    linkedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IdeathonEvent',
      default: null,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Current status — initial state is draft
    status: {
      type: String,
      enum: ALL_IDEA_STATUSES,
      default: IDEA_STATUS.DRAFT,
    },

    // Append-only status trail — FRD §5.2
    statusHistory: [statusHistorySchema],

    // Track how many times submitter has resubmitted after Send Back — FR-03-03
    resubmitCount: {
      type: Number,
      default: 0,
    },

    // Auto-save state — FR-02-05
    isDraftAutoSaved: {
      type: Boolean,
      default: false,
    },
    lastAutoSavedAt: {
      type: Date,
      default: null,
    },

    // Supervisor assigned to this idea (set at submission time from submittedBy.managerId)
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Evaluators explicitly assigned to this idea
    assignedEvaluators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // Set by Admin on committee "Approve for Publishing" action — featured flag
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Set when idea is published — for gallery ordering
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Indexes — Master Prompt §10
// (Single declaration per index; MongoDB permits only ONE text index per
//  collection, so all searchable fields are combined into one below.)
// ---------------------------------------------------------------------------
ideaSchema.index({ status: 1 });
ideaSchema.index({ submittedBy: 1 });
ideaSchema.index({ department: 1 });
ideaSchema.index({ category: 1 });
ideaSchema.index({ linkedEventId: 1 });
ideaSchema.index({ status: 1, department: 1 }); // compound for dashboard queries
ideaSchema.index({ supervisorId: 1, status: 1 }); // supervisor queue
ideaSchema.index({ publishedAt: -1 });            // gallery ordering
ideaSchema.index({ isFeatured: 1 });

// The single text index for search + duplicate detection (FR-02-06, FR-06-03).
// Covers title, keywords, problem statement, and proposed solution.
ideaSchema.index(
  {
    title: 'text',
    keywords: 'text',
    problemStatement: 'text',
    proposedSolution: 'text',
  },
  {
    weights: { title: 10, keywords: 5, proposedSolution: 2, problemStatement: 1 },
    name: 'gallery_text_search',
  }
);

// ---------------------------------------------------------------------------
// Pre-save: generate ideaId on first save (when status transitions from draft)
// Only generate when not already set (idempotent)
// ---------------------------------------------------------------------------
ideaSchema.pre('save', async function () {
  if (!this.ideaId && !this.isNew) return;
  if (!this.ideaId) {
    const Counter = require('./Counter');
    const year = new Date().getFullYear();
    const seq = await Counter.nextSequence('idea', year);
    this.ideaId = Counter.formatId('IDEA', year, seq);
  }
});

module.exports = mongoose.model('Idea', ideaSchema);
