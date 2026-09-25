/**
 * server/models/AuditLog.js
 * IMMUTABLE append-only audit log — never update or delete.
 *
 * Key invariants:
 * - No update or delete routes are ever created for this collection.
 * - All mutating operations (create/update/delete/approval/status-change)
 *   in every controller MUST call auditService.log() before returning.
 * - beforeState and afterState store JSON snapshots for change diffing.
 *
 * FRD NFR Audit & Compliance, FR-AD-09, Master Prompt §4.10
 */
const mongoose = require('mongoose');
const { AUDIT_ACTION } = require('../../shared/constants');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTION),
      required: true,
    },
    entityType: {
      type: String,
      required: true, // e.g. 'Idea', 'User', 'IdeathonEvent'
      trim: true,
    },
    entityId: {
      type: String,
      required: true, // stored as string to handle ObjectId + human IDs
    },
    // JSON snapshots — null for create (no before) or delete (no after)
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Additional context (e.g., admin override reason, comment)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No timestamps: true — we use our own immutable `timestamp` field
    // No updatedAt — this document must never be updated
  }
);

// Indexes — Master Prompt §10
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
// Compound for audit log report filters
auditLogSchema.index({ entityType: 1, action: 1, timestamp: -1 });

// Data retention: 7 years — FRD NFR Audit & Compliance
// TTL index NOT used (we must retain 7 years, not auto-expire).
// Archival strategy documented in DEPLOYMENT.md.

module.exports = mongoose.model('AuditLog', auditLogSchema);
