/**
 * server/services/auditService.js
 * Centralized audit logging service — wired from Day 1.
 *
 * INVARIANT: Every controller that creates, updates, deletes, or changes
 * status of any entity MUST call auditService.log() before returning.
 * Do NOT retrofit this — it is intentionally set up in Phase 0.
 *
 * The AuditLog collection is IMMUTABLE — no update or delete operations
 * are ever performed on it. Only append via this service.
 *
 * FRD NFR Audit & Compliance, FR-AD-09, Master Prompt §4.10
 */
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Append an audit log entry.
 *
 * @param {object} params
 * @param {import('mongoose').Types.ObjectId} params.actorId  - Who performed the action
 * @param {string} params.action       - One of AUDIT_ACTION values
 * @param {string} params.entityType   - e.g. 'Idea', 'User', 'IdeathonEvent'
 * @param {string} params.entityId     - String representation of the entity's ID
 * @param {*}     [params.beforeState] - Snapshot before change (null for create)
 * @param {*}     [params.afterState]  - Snapshot after change (null for delete)
 * @param {*}     [params.metadata]    - Additional context (override reason, comment, etc.)
 * @param {string} [params.ipAddress]  - Request IP address
 * @param {string} [params.userAgent]  - Request User-Agent string
 * @returns {Promise<void>} — fire-and-forget; errors are logged but not propagated
 */
const log = async ({
  actorId,
  action,
  entityType,
  entityId,
  beforeState = null,
  afterState = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId: String(entityId),
      beforeState,
      afterState,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit failure must never crash the main request — log it and continue
    logger.error('AuditService: failed to write audit log', {
      err: err.message,
      actorId,
      action,
      entityType,
      entityId,
    });
  }
};

/**
 * Convenience helper: diff two plain objects and return changed fields only.
 * Useful for constructing beforeState/afterState snapshots.
 *
 * @param {object} before
 * @param {object} after
 * @returns {{ before: object, after: object }}
 */
const diff = (before, after) => {
  const changedBefore = {};
  const changedAfter = {};
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of allKeys) {
    // Skip internal Mongoose fields
    if (['__v', 'updatedAt'].includes(key)) continue;
    const bVal = JSON.stringify(before?.[key]);
    const aVal = JSON.stringify(after?.[key]);
    if (bVal !== aVal) {
      changedBefore[key] = before?.[key];
      changedAfter[key] = after?.[key];
    }
  }

  return { before: changedBefore, after: changedAfter };
};

module.exports = { log, diff };
