/**
 * server/services/workflowService.js
 * Status machine for the idea lifecycle.
 *
 * This is the single authority for all status transitions.
 * ALL status changes MUST go through this service — never directly set idea.status.
 *
 * Enforces:
 * - STATUS_TRANSITIONS matrix (shared/constants.js)
 * - Role permissions per transition
 * - Business rules (comment length, evaluator count, etc.)
 * - Writes to statusHistory on every transition
 * - Calls auditService.log() on every transition
 *
 * Admin override: any transition allowed with mandatory reason, logged with ADMIN_OVERRIDE action.
 *
 * FRD §5 (Lifecycle), §5.2 (Status Trail), Master Prompt §5
 */
const Idea = require('../models/Idea');
const Evaluation = require('../models/Evaluation');
const auditService = require('./auditService');
const AppError = require('../utils/AppError');
const {
  IDEA_STATUS,
  STATUS_TRANSITIONS,
  ROLES,
  AUDIT_ACTION,
  MIN_CHARS,
} = require('../../shared/constants');

// ---------------------------------------------------------------------------
// Per-transition business rule validators
// Called before the transition is applied.
// Return null if valid, throw AppError if not.
// ---------------------------------------------------------------------------
const TRANSITION_VALIDATORS = {
  // Supervisor actions require ≥20-char comment for Reject and Return (FR-03-02)
  [IDEA_STATUS.SUPERVISOR_REJECTED]: async (idea, actor, { comment }) => {
    if (!comment || comment.trim().length < MIN_CHARS.SUPERVISOR_COMMENT) {
      throw new AppError(
        `Rejection comment must be at least ${MIN_CHARS.SUPERVISOR_COMMENT} characters (FR-03-02).`,
        422
      );
    }
  },
  [IDEA_STATUS.RETURNED]: async (idea, actor, { comment }) => {
    if (!comment || comment.trim().length < MIN_CHARS.SUPERVISOR_COMMENT) {
      throw new AppError(
        `Send-back comment must be at least ${MIN_CHARS.SUPERVISOR_COMMENT} characters (FR-03-02).`,
        422
      );
    }
  },

  // Shortlisting requires ≥2 evaluator scores (FR-04-03)
  [IDEA_STATUS.SHORTLISTED]: async (idea, actor, options) => {
    const evalCount = await Evaluation.countDocuments({ ideaId: idea._id });
    if (evalCount < 2) {
      throw new AppError(
        `At least 2 evaluator scores are required before shortlisting (FR-04-03). Current: ${evalCount}.`,
        422
      );
    }
  },

  // Committee reject must include rationale (FR-05-05)
  [IDEA_STATUS.COMMITTEE_REJECTED]: async (idea, actor, { comment }) => {
    if (!comment || comment.trim().length < 20) {
      throw new AppError(
        'Committee rejection rationale is mandatory and must be at least 20 characters (FR-05-05).',
        422
      );
    }
  },

  // Approve for Implementation requires implementationOwnerId (FR-05-03)
  [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION]: async (idea, actor, { implementationOwnerId }) => {
    if (!implementationOwnerId) {
      throw new AppError(
        'Implementation Owner must be assigned when approving for implementation (FR-05-03).',
        422
      );
    }
  },
};

// ---------------------------------------------------------------------------
// Role permissions per transition
// Key: target status. Value: array of roles allowed to trigger this transition.
// 'system' = automated (cron, internal service call)
// ---------------------------------------------------------------------------
const TRANSITION_ROLE_MAP = {
  [IDEA_STATUS.SUBMITTED]:                    [ROLES.EMPLOYEE, ROLES.ADMIN],
  [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW]:      ['system', ROLES.ADMIN],
  [IDEA_STATUS.SUPERVISOR_APPROVED]:          [ROLES.SUPERVISOR, ROLES.ADMIN],
  [IDEA_STATUS.RETURNED]:                     [ROLES.SUPERVISOR, ROLES.ADMIN],
  [IDEA_STATUS.SUPERVISOR_REJECTED]:          [ROLES.SUPERVISOR, ROLES.ADMIN],
  [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION]:  ['system', ROLES.ADMIN],
  [IDEA_STATUS.SHORTLISTED]:                  [ROLES.DEPT_INNOVATION_TEAM, ROLES.ADMIN],
  [IDEA_STATUS.REJECTED_BY_DEPT]:             [ROLES.DEPT_INNOVATION_TEAM, ROLES.ADMIN],
  [IDEA_STATUS.UNDER_COMMITTEE_REVIEW]:       ['system', ROLES.ADMIN],
  [IDEA_STATUS.APPROVED_FOR_PUBLISHING]:      [ROLES.INNOVATION_COMMITTEE, ROLES.ADMIN],
  [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION]:  [ROLES.INNOVATION_COMMITTEE, ROLES.ADMIN],
  [IDEA_STATUS.COMMITTEE_REJECTED]:           [ROLES.INNOVATION_COMMITTEE, ROLES.ADMIN],
  [IDEA_STATUS.PUBLISHED]:                    ['system', ROLES.ADMIN],
  [IDEA_STATUS.IMPLEMENTATION_INITIATED]:     ['system', ROLES.ADMIN],
  [IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS]:   [ROLES.IMPLEMENTATION_OWNER, ROLES.ADMIN],
  [IDEA_STATUS.IMPLEMENTATION_COMPLETED]:     [ROLES.IMPLEMENTATION_OWNER, ROLES.ADMIN],
  [IDEA_STATUS.BENEFITS_RECORDED]:            [ROLES.IMPLEMENTATION_OWNER, ROLES.ADMIN],
  [IDEA_STATUS.OUTCOME_MONITORED]:            [ROLES.INNOVATION_COMMITTEE, ROLES.ADMIN],
  [IDEA_STATUS.CLOSED]:                       [ROLES.INNOVATION_COMMITTEE, ROLES.ADMIN],
};

// ---------------------------------------------------------------------------
// Core transition function
// ---------------------------------------------------------------------------

/**
 * Transition an idea to a new status.
 *
 * @param {object} params
 * @param {import('mongoose').Document} params.idea - Mongoose Idea document
 * @param {string} params.toStatus - Target status from IDEA_STATUS
 * @param {object} params.actor - req.user (or { _id, roles: ['system'] } for automated calls)
 * @param {string} [params.comment] - Optional/required comment (role-dependent)
 * @param {boolean} [params.isAdminOverride] - True if admin is bypassing normal flow
 * @param {string} [params.overrideReason] - Required when isAdminOverride=true
 * @param {object} [params.extra] - Additional data for specific transitions
 * @param {string} [params.ipAddress]
 * @returns {Promise<import('mongoose').Document>} Updated idea document
 */
const transition = async ({
  idea,
  toStatus,
  actor,
  comment = '',
  isAdminOverride = false,
  overrideReason = '',
  extra = {},
  ipAddress = null,
}) => {
  const fromStatus = idea.status;

  // ── 1. Validate the transition is in the allowed matrix ──
  const allowedNextStatuses = STATUS_TRANSITIONS[fromStatus] || [];

  if (!allowedNextStatuses.includes(toStatus)) {
    if (!isAdminOverride) {
      throw new AppError(
        `Invalid status transition: ${fromStatus} → ${toStatus}. Allowed from ${fromStatus}: [${allowedNextStatuses.join(', ')}]`,
        422
      );
    }
    // Admin override allows any transition — must log with ADMIN_OVERRIDE action
    if (!overrideReason || overrideReason.trim().length < 20) {
      throw new AppError(
        'Admin override reason must be at least 20 characters.',
        422
      );
    }
  }

  // ── 2. Check role permissions ──
  const allowedRoles = TRANSITION_ROLE_MAP[toStatus] || [];
  const actorRoles = actor.roles || [];
  const isSystem = actorRoles.includes('system');
  const hasPermission =
    isSystem ||
    allowedRoles.some((r) => r === 'system' ? false : actorRoles.includes(r));

  if (!hasPermission && !isAdminOverride) {
    throw new AppError(
      `You do not have permission to perform this status transition (→ ${toStatus}).`,
      403
    );
  }

  // ── 3. Run business rule validator for target status ──
  const validator = TRANSITION_VALIDATORS[toStatus];
  if (validator) {
    await validator(idea, actor, { comment, ...extra });
  }

  // ── 4. Apply the transition ──
  const historyEntry = {
    status: toStatus,
    actor: actor._id,
    comment: comment.trim(),
    timestamp: new Date(),
  };
  idea.statusHistory.push(historyEntry);
  idea.status = toStatus;

  // ── 5. Handle side effects for specific transitions ──
  if (toStatus === IDEA_STATUS.RETURNED) {
    idea.resubmitCount += 1;
  }
  if (toStatus === IDEA_STATUS.PUBLISHED) {
    idea.publishedAt = new Date();
  }

  await idea.save();

  // ── 6. Write to AuditLog ──
  const auditAction = isAdminOverride ? AUDIT_ACTION.ADMIN_OVERRIDE : AUDIT_ACTION.STATUS_CHANGE;
  await auditService.log({
    actorId: actor._id,
    action: auditAction,
    entityType: 'Idea',
    entityId: idea._id.toString(),
    beforeState: { status: fromStatus },
    afterState: { status: toStatus },
    metadata: {
      comment: comment.trim(),
      isAdminOverride,
      overrideReason: isAdminOverride ? overrideReason : undefined,
      ...extra,
    },
    ipAddress,
  });

  return idea;
};

// ---------------------------------------------------------------------------
// Convenience wrappers for common transitions
// ---------------------------------------------------------------------------

/** Submit a draft idea → triggers supervisor assignment */
const submitIdea = (idea, actor, options) =>
  transition({ idea, toStatus: IDEA_STATUS.SUBMITTED, actor, ...options });

/** Auto-route submitted idea → under_supervisor_review (system call) */
const routeToSupervisor = (idea) =>
  transition({
    idea,
    toStatus: IDEA_STATUS.UNDER_SUPERVISOR_REVIEW,
    actor: { _id: idea.supervisorId || idea.submittedBy, roles: ['system'] },
  });

/** Supervisor approves */
const supervisorApprove = (idea, actor, options) =>
  transition({ idea, toStatus: IDEA_STATUS.SUPERVISOR_APPROVED, actor, ...options });

/** Supervisor rejects — comment ≥20 chars required */
const supervisorReject = (idea, actor, options) =>
  transition({ idea, toStatus: IDEA_STATUS.SUPERVISOR_REJECTED, actor, ...options });

/** Supervisor returns for clarification — comment ≥20 chars required */
const supervisorReturn = (idea, actor, options) =>
  transition({ idea, toStatus: IDEA_STATUS.RETURNED, actor, ...options });

/** Auto-route approved idea → dept evaluation (system) */
const routeToDeptEvaluation = (idea) =>
  transition({
    idea,
    toStatus: IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION,
    actor: { _id: idea.submittedBy, roles: ['system'] },
  });

/** Dept team shortlists (requires ≥2 evaluator scores) */
const shortlist = (idea, actor, options) =>
  transition({ idea, toStatus: IDEA_STATUS.SHORTLISTED, actor, ...options });

/** Dept team rejects */
const rejectByDept = (idea, actor, options) =>
  transition({ idea, toStatus: IDEA_STATUS.REJECTED_BY_DEPT, actor, ...options });

/** Auto-route shortlisted idea → committee review (system) */
const routeToCommittee = (idea) =>
  transition({
    idea,
    toStatus: IDEA_STATUS.UNDER_COMMITTEE_REVIEW,
    actor: { _id: idea.submittedBy, roles: ['system'] },
  });

module.exports = {
  transition,
  submitIdea,
  routeToSupervisor,
  supervisorApprove,
  supervisorReject,
  supervisorReturn,
  routeToDeptEvaluation,
  shortlist,
  rejectByDept,
  routeToCommittee,
};
