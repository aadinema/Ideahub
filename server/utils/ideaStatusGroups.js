/**
 * server/utils/ideaStatusGroups.js
 * Canonical IDEA status groupings used by reporting and executive dashboards.
 *
 * Previously these arrays were re-declared inline in each controller
 * (reportController, dashboardController) — this module makes them a single
 * source of truth so "Approved" and "Implemented" always mean the same thing
 * across the product.
 *
 * Definitions (FRD §5.2 lifecycle):
 *   APPROVED    — idea passed the Innovation Committee (any state at or after
 *                 committee approval, including published & implemented states).
 *   IMPLEMENTED — idea reached implementation completion or later.
 *   ACTIVE      — idea is currently moving through the workflow (excludes
 *                 drafts and terminal rejections/closures).
 *   REVIEW      — states where the idea is waiting on a reviewer; each maps
 *                 to its SLA in SLA_BUSINESS_DAYS (FRD §5.1 / FR-03-04).
 */
const { IDEA_STATUS, SLA_BUSINESS_DAYS, IDEA_STATUS_GROUPS } = require('../../shared/constants');

/** Idea has been approved by the Innovation Committee (or is past it). */
const APPROVED_STATUSES = IDEA_STATUS_GROUPS.APPROVED;

/** Implementation reached 100% (benefits may still be recorded/monitored). */
const IMPLEMENTED_STATUSES = IDEA_STATUS_GROUPS.IMPLEMENTED;

/** Currently in the workflow (non-draft, non-terminal). */
const ACTIVE_STATUSES = IDEA_STATUS_GROUPS.ACTIVE;

/**
 * Review stages with their SLA (business days) — used for bottleneck detection.
 * `waitingStatuses` = current statuses that count as "waiting in this stage".
 */
const REVIEW_STAGES = Object.freeze([
  {
    key: 'supervisor',
    label: 'Supervisor Review',
    slaBusinessDays: SLA_BUSINESS_DAYS.SUPERVISOR,
    waitingStatuses: [IDEA_STATUS.SUBMITTED, IDEA_STATUS.UNDER_SUPERVISOR_REVIEW],
  },
  {
    key: 'department',
    label: 'Department Evaluation',
    slaBusinessDays: SLA_BUSINESS_DAYS.DEPARTMENT,
    waitingStatuses: [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION],
  },
  {
    key: 'committee',
    label: 'Committee Review',
    slaBusinessDays: SLA_BUSINESS_DAYS.COMMITTEE,
    waitingStatuses: [IDEA_STATUS.UNDER_COMMITTEE_REVIEW],
  },
]);

/**
 * Executive pipeline funnel — ordered stages used by the CEO dashboard.
 * `current`  = statuses that count as "currently waiting in this stage"
 *              (a stage's funnel count uses `everReached` instead).
 * `funnelStatus` = statuses whose presence in statusHistory means the idea
 *              ever reached this stage (for conversion rates).
 */
const PIPELINE_STAGES = Object.freeze([
  {
    key: 'submitted',
    label: 'Submitted',
    funnelStatuses: [IDEA_STATUS.SUBMITTED],
    current: [IDEA_STATUS.SUBMITTED, IDEA_STATUS.RETURNED],
  },
  {
    key: 'supervisor_review',
    label: 'Supervisor Review',
    funnelStatuses: [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW],
    current: [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW],
  },
  {
    key: 'department_evaluation',
    label: 'Department Evaluation',
    funnelStatuses: [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION],
    // supervisor_approved = queued for dept pickup (still in this stage)
    current: [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, IDEA_STATUS.SUPERVISOR_APPROVED],
  },
  {
    key: 'committee_review',
    label: 'Committee Review',
    funnelStatuses: [IDEA_STATUS.UNDER_COMMITTEE_REVIEW],
    // shortlisted = queued for committee pickup (still in this stage)
    current: [IDEA_STATUS.UNDER_COMMITTEE_REVIEW, IDEA_STATUS.SHORTLISTED],
  },
  {
    key: 'approved',
    label: 'Approved',
    funnelStatuses: [
      IDEA_STATUS.APPROVED_FOR_PUBLISHING,
      IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
    ],
    current: [
      IDEA_STATUS.APPROVED_FOR_PUBLISHING,
      IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      IDEA_STATUS.PUBLISHED,
    ],
  },
  {
    key: 'implementation',
    label: 'Implementation',
    funnelStatuses: [
      IDEA_STATUS.IMPLEMENTATION_INITIATED,
      IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS,
    ],
    current: [
      IDEA_STATUS.IMPLEMENTATION_INITIATED,
      IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS,
    ],
  },
  {
    key: 'implemented',
    label: 'Implemented',
    funnelStatuses: IMPLEMENTED_STATUSES,
    current: IMPLEMENTED_STATUSES,
  },
]);

module.exports = {
  APPROVED_STATUSES,
  IMPLEMENTED_STATUSES,
  ACTIVE_STATUSES,
  REVIEW_STAGES,
  PIPELINE_STAGES,
};
