/**
 * shared/constants.js
 * Single source of truth for all enums and constants.
 * Imported by BOTH client (via relative path or alias) and server.
 * Do NOT add business logic here — constants only.
 *
 * FRD refs: Section 4 (Data Model), Section 5 (Lifecycle), Section 7 (Events),
 *           Section 8 (Evaluation), Master Prompt Section 4
 */

// ---------------------------------------------------------------------------
// USER ROLES — FRD §4, Master Prompt §3
// ---------------------------------------------------------------------------
const ROLES = Object.freeze({
  EMPLOYEE: 'employee',
  SUPERVISOR: 'supervisor',
  DEPT_INNOVATION_TEAM: 'dept_innovation_team',
  INNOVATION_COMMITTEE: 'innovation_committee',
  IMPLEMENTATION_OWNER: 'implementation_owner',
  ADMIN: 'admin',
});

const ALL_ROLES = Object.values(ROLES);

// ---------------------------------------------------------------------------
// IDEA STATUSES — FRD §5.2 exact sequence (20 states)
// ---------------------------------------------------------------------------
const IDEA_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_SUPERVISOR_REVIEW: 'under_supervisor_review',
  SUPERVISOR_APPROVED: 'supervisor_approved',
  RETURNED: 'returned',
  SUPERVISOR_REJECTED: 'supervisor_rejected',
  UNDER_DEPARTMENT_EVALUATION: 'under_department_evaluation',
  SHORTLISTED: 'shortlisted',
  REJECTED_BY_DEPT: 'rejected_by_dept',
  UNDER_COMMITTEE_REVIEW: 'under_committee_review',
  APPROVED_FOR_PUBLISHING: 'approved_for_publishing',
  APPROVED_FOR_IMPLEMENTATION: 'approved_for_implementation',
  COMMITTEE_REJECTED: 'committee_rejected',
  PUBLISHED: 'published',
  IMPLEMENTATION_INITIATED: 'implementation_initiated',
  IMPLEMENTATION_IN_PROGRESS: 'implementation_in_progress',
  IMPLEMENTATION_COMPLETED: 'implementation_completed',
  BENEFITS_RECORDED: 'benefits_recorded',
  OUTCOME_MONITORED: 'outcome_monitored',
  CLOSED: 'closed',
});

const ALL_IDEA_STATUSES = Object.values(IDEA_STATUS);

/**
 * Status machine — allowed transitions.
 * Key: current status. Value: array of statuses this can legally transition to.
 * Server enforces this; any attempt to jump a step returns HTTP 422.
 * Admin override is allowed but must be logged in AuditLog with reason.
 *
 * FRD §5.2, Master Prompt §5
 */
const STATUS_TRANSITIONS = Object.freeze({
  [IDEA_STATUS.DRAFT]: [IDEA_STATUS.SUBMITTED],
  [IDEA_STATUS.SUBMITTED]: [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW],
  [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW]: [
    IDEA_STATUS.SUPERVISOR_APPROVED,
    IDEA_STATUS.RETURNED,
    IDEA_STATUS.SUPERVISOR_REJECTED,
  ],
  [IDEA_STATUS.SUPERVISOR_APPROVED]: [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION],
  // RETURNED → employee revises → resubmits → goes back to under_supervisor_review
  [IDEA_STATUS.RETURNED]: [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW],
  [IDEA_STATUS.SUPERVISOR_REJECTED]: [], // terminal
  [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION]: [
    IDEA_STATUS.SHORTLISTED,
    IDEA_STATUS.REJECTED_BY_DEPT,
  ],
  [IDEA_STATUS.SHORTLISTED]: [IDEA_STATUS.UNDER_COMMITTEE_REVIEW],
  [IDEA_STATUS.REJECTED_BY_DEPT]: [], // terminal
  [IDEA_STATUS.UNDER_COMMITTEE_REVIEW]: [
    IDEA_STATUS.APPROVED_FOR_PUBLISHING,
    IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
    IDEA_STATUS.COMMITTEE_REJECTED,
    // Defer re-enters queue at submitted stage; Admin logs the override
    IDEA_STATUS.SUBMITTED,
  ],
  [IDEA_STATUS.COMMITTEE_REJECTED]: [], // terminal
  [IDEA_STATUS.APPROVED_FOR_PUBLISHING]: [IDEA_STATUS.PUBLISHED],
  [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION]: [IDEA_STATUS.IMPLEMENTATION_INITIATED],
  [IDEA_STATUS.PUBLISHED]: [IDEA_STATUS.OUTCOME_MONITORED, IDEA_STATUS.CLOSED],
  [IDEA_STATUS.IMPLEMENTATION_INITIATED]: [IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS],
  [IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS]: [IDEA_STATUS.IMPLEMENTATION_COMPLETED],
  [IDEA_STATUS.IMPLEMENTATION_COMPLETED]: [IDEA_STATUS.BENEFITS_RECORDED],
  [IDEA_STATUS.BENEFITS_RECORDED]: [IDEA_STATUS.OUTCOME_MONITORED],
  [IDEA_STATUS.OUTCOME_MONITORED]: [IDEA_STATUS.CLOSED],
  [IDEA_STATUS.CLOSED]: [], // terminal
});

// ---------------------------------------------------------------------------
// BENEFIT TYPES — FRD FR-02-03
// ---------------------------------------------------------------------------
const BENEFIT_TYPE = Object.freeze({
  COST_REDUCTION: 'cost_reduction',
  TIME_SAVINGS: 'time_savings',
  AUTOMATION: 'automation',
  CUSTOMER_EXPERIENCE: 'customer_experience',
  REVENUE_GENERATION: 'revenue_generation',
  EMPLOYEE_SATISFACTION: 'employee_satisfaction',
  COMPLIANCE_IMPROVEMENT: 'compliance_improvement',
  PROCESS_OPTIMIZATION: 'process_optimization',
});

const ALL_BENEFIT_TYPES = Object.values(BENEFIT_TYPE);

// ---------------------------------------------------------------------------
// IDEATHON EVENT TYPES — FRD §7.1
// ---------------------------------------------------------------------------
const EVENT_TYPE = Object.freeze({
  IDEATHON: 'ideathon',
  WORKSHOP: 'workshop',
  CONFERENCE: 'conference',
  SURVEY_POLL: 'survey_poll',
  TRAINING: 'training',
  CELEBRATION: 'celebration',
});

const ALL_EVENT_TYPES = Object.values(EVENT_TYPE);

// ---------------------------------------------------------------------------
// EVENT VISIBILITY — FRD FR-IE-02
// ---------------------------------------------------------------------------
const EVENT_VISIBILITY = Object.freeze({
  PUBLISHED: 'published',
  RESTRICTED: 'restricted',
  DRAFT: 'draft',
});

const ALL_EVENT_VISIBILITIES = Object.values(EVENT_VISIBILITY);

// ---------------------------------------------------------------------------
// EVENT STATUS
// ---------------------------------------------------------------------------
const EVENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  EXTENDED: 'extended',
});

const ALL_EVENT_STATUSES = Object.values(EVENT_STATUS);

// ---------------------------------------------------------------------------
// EVALUATION DECISION — FR-04-04
// ---------------------------------------------------------------------------
const EVALUATION_DECISION = Object.freeze({
  SHORTLIST: 'shortlist',
  REJECT: 'reject',
  ESCALATE: 'escalate',
});

const ALL_EVALUATION_DECISIONS = Object.values(EVALUATION_DECISION);

// ---------------------------------------------------------------------------
// MILESTONE STATUS — FR-07-02
// ---------------------------------------------------------------------------
const MILESTONE_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
});

const ALL_MILESTONE_STATUSES = Object.values(MILESTONE_STATUS);

// ---------------------------------------------------------------------------
// BENEFIT ENDORSEMENT STATUS — FR-08-05
// ---------------------------------------------------------------------------
const ENDORSEMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  ENDORSED: 'endorsed',
  DISPUTED: 'disputed',
});

const ALL_ENDORSEMENT_STATUSES = Object.values(ENDORSEMENT_STATUS);

// ---------------------------------------------------------------------------
// DEPARTMENT TARGET TYPE — FRD §9.1
// ---------------------------------------------------------------------------
const TARGET_TYPE = Object.freeze({
  TOTAL_IDEAS: 'total_ideas',
  APPROVED_IDEAS: 'approved_ideas',
  IMPLEMENTED_IDEAS: 'implemented_ideas',
});

const ALL_TARGET_TYPES = Object.values(TARGET_TYPE);

// ---------------------------------------------------------------------------
// NOTIFICATION CHANNELS — FRD §11
// ---------------------------------------------------------------------------
const NOTIFICATION_CHANNEL = Object.freeze({
  EMAIL: 'email',
  IN_APP: 'in_app',
  DASHBOARD_ALERT: 'dashboard_alert',
});

const ALL_NOTIFICATION_CHANNELS = Object.values(NOTIFICATION_CHANNEL);

// ---------------------------------------------------------------------------
// NOTIFICATION TRIGGER EVENTS — FRD §11 (exact trigger matrix)
// ---------------------------------------------------------------------------
const NOTIFICATION_EVENT = Object.freeze({
  IDEA_SUBMITTED: 'idea_submitted',
  ASSIGNED_FOR_SUPERVISOR_REVIEW: 'assigned_for_supervisor_review',
  APPROVED_BY_SUPERVISOR: 'approved_by_supervisor',
  RETURNED_FOR_CLARIFICATION: 'returned_for_clarification',
  IDEA_REJECTED: 'idea_rejected',
  ROUTED_TO_DEPT_EVALUATION: 'routed_to_dept_evaluation',
  SHORTLISTED_BY_DEPT: 'shortlisted_by_dept',
  APPROVED_BY_COMMITTEE: 'approved_by_committee',
  PUBLISHED_TO_GALLERY: 'published_to_gallery',
  IMPLEMENTATION_ASSIGNED: 'implementation_assigned',
  MILESTONE_OVERDUE: 'milestone_overdue',
  IMPLEMENTATION_COMPLETED: 'implementation_completed',
  SUPERVISOR_SLA_BREACH: 'supervisor_sla_breach',
  NEW_IDEATHON_LAUNCHED: 'new_ideathon_launched',
  IDEATHON_CLOSING_48H: 'ideathon_closing_48h',
});

/**
 * Notification channel matrix — FRD §11.
 * email / inApp / dashboardAlert flags per trigger event.
 */
const NOTIFICATION_MATRIX = Object.freeze({
  [NOTIFICATION_EVENT.IDEA_SUBMITTED]:               { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.ASSIGNED_FOR_SUPERVISOR_REVIEW]:{ email: true,  inApp: true,  dashboardAlert: true  },
  [NOTIFICATION_EVENT.APPROVED_BY_SUPERVISOR]:        { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.RETURNED_FOR_CLARIFICATION]:    { email: true,  inApp: true,  dashboardAlert: true  },
  [NOTIFICATION_EVENT.IDEA_REJECTED]:                { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.ROUTED_TO_DEPT_EVALUATION]:    { email: true,  inApp: true,  dashboardAlert: true  },
  [NOTIFICATION_EVENT.SHORTLISTED_BY_DEPT]:          { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.APPROVED_BY_COMMITTEE]:        { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.PUBLISHED_TO_GALLERY]:         { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.IMPLEMENTATION_ASSIGNED]:      { email: true,  inApp: true,  dashboardAlert: true  },
  [NOTIFICATION_EVENT.MILESTONE_OVERDUE]:            { email: true,  inApp: true,  dashboardAlert: true  },
  [NOTIFICATION_EVENT.IMPLEMENTATION_COMPLETED]:     { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.SUPERVISOR_SLA_BREACH]:        { email: true,  inApp: true,  dashboardAlert: true  },
  [NOTIFICATION_EVENT.NEW_IDEATHON_LAUNCHED]:        { email: true,  inApp: true,  dashboardAlert: false },
  [NOTIFICATION_EVENT.IDEATHON_CLOSING_48H]:         { email: true,  inApp: true,  dashboardAlert: true  },
});

// ---------------------------------------------------------------------------
// CATEGORY TYPES — Master Prompt §4.12
// ---------------------------------------------------------------------------
const CATEGORY_TYPE = Object.freeze({
  CATEGORY: 'category',
  SUBCATEGORY: 'subcategory',
  INITIATIVE: 'initiative',
});

const ALL_CATEGORY_TYPES = Object.values(CATEGORY_TYPE);

// ---------------------------------------------------------------------------
// QUORUM TYPES — FR-05-04
// ---------------------------------------------------------------------------
const QUORUM_TYPE = Object.freeze({
  MAJORITY: 'majority',       // > 50% of active committee members
  FIXED_COUNT: 'fixed_count', // exact N votes required
});

const ALL_QUORUM_TYPES = Object.values(QUORUM_TYPE);

// ---------------------------------------------------------------------------
// AUDIT ACTIONS
// ---------------------------------------------------------------------------
const AUDIT_ACTION = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  STATUS_CHANGE: 'status_change',
  APPROVE: 'approve',
  REJECT: 'reject',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  ADMIN_OVERRIDE: 'admin_override',
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',
  BULK_IMPORT: 'bulk_import',
});

// ---------------------------------------------------------------------------
// FINANCIAL YEAR — April 1 start (India standard) — confirmed by user
// ---------------------------------------------------------------------------
const FY_START_MONTH = 4; // April (1-indexed)

/**
 * Returns the financial year label for a given date.
 * e.g., date 2026-08-08 → "FY2026-27"
 */
function getFYLabel(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const fyStartYear = month >= FY_START_MONTH ? year : year - 1;
  return `FY${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
}

/**
 * Returns the FY start and end Date objects for a given FY label or current FY.
 * e.g., "FY2026-27" → { start: 2026-04-01, end: 2027-03-31 }
 */
function getFYDateRange(fyLabel) {
  if (!fyLabel) {
    const now = new Date();
    fyLabel = getFYLabel(now);
  }
  const match = fyLabel.match(/FY(\d{4})-(\d{2})/);
  if (!match) throw new Error(`Invalid FY label: ${fyLabel}`);
  const startYear = parseInt(match[1], 10);
  const endYear = startYear + 1;
  return {
    start: new Date(`${startYear}-04-01T00:00:00.000Z`),
    end: new Date(`${endYear}-03-31T23:59:59.999Z`),
  };
}

// ---------------------------------------------------------------------------
// SLA CONFIGURATION (business days) — FRD §5.1
// ---------------------------------------------------------------------------
const SLA_BUSINESS_DAYS = Object.freeze({
  SUPERVISOR: 3,
  DEPARTMENT: 5,
  COMMITTEE: 7,
});

// SLA warning thresholds (% of SLA elapsed — FR-03-04)
const SLA_AMBER_THRESHOLD_PCT = 66; // amber warning
const SLA_RED_THRESHOLD_PCT = 100;  // breached

// ---------------------------------------------------------------------------
// FILE UPLOAD CONSTRAINTS — FR-02-04
// ---------------------------------------------------------------------------
const UPLOAD_CONSTRAINTS = Object.freeze({
  MAX_FILES: 5,
  MAX_SIZE_BYTES: 20 * 1024 * 1024, // 20 MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.ppt', '.pptx', '.mp4'],
});

// ---------------------------------------------------------------------------
// BENEFIT EVIDENCE THRESHOLD — FR-08-01
// ---------------------------------------------------------------------------
const EVIDENCE_REQUIRED_THRESHOLD_INR = 100_000; // ₹1 Lakh

// ---------------------------------------------------------------------------
// PAGINATION DEFAULTS
// ---------------------------------------------------------------------------
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
});

// ---------------------------------------------------------------------------
// AUTO-SAVE INTERVAL — FR-02-05
// ---------------------------------------------------------------------------
const AUTO_SAVE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

// ---------------------------------------------------------------------------
// MINIMUM CHARACTER CONSTRAINTS — FR-02-02, FR-03-02
// ---------------------------------------------------------------------------
const MIN_CHARS = Object.freeze({
  PROBLEM_STATEMENT: 50,
  SUPERVISOR_COMMENT: 20,      // for Reject and Send Back
  OPERATIONAL_DESCRIPTION: 50, // FR-08-02
});

// ---------------------------------------------------------------------------
// EXPORTS (CommonJS + Vite ESM CJS-interop named exports)
// ---------------------------------------------------------------------------
exports.ROLES = ROLES;
exports.ALL_ROLES = ALL_ROLES;
exports.IDEA_STATUS = IDEA_STATUS;
exports.ALL_IDEA_STATUSES = ALL_IDEA_STATUSES;
exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
exports.BENEFIT_TYPE = BENEFIT_TYPE;
exports.ALL_BENEFIT_TYPES = ALL_BENEFIT_TYPES;
exports.EVENT_TYPE = EVENT_TYPE;
exports.ALL_EVENT_TYPES = ALL_EVENT_TYPES;
exports.EVENT_VISIBILITY = EVENT_VISIBILITY;
exports.ALL_EVENT_VISIBILITIES = ALL_EVENT_VISIBILITIES;
exports.EVENT_STATUS = EVENT_STATUS;
exports.ALL_EVENT_STATUSES = ALL_EVENT_STATUSES;
exports.EVALUATION_DECISION = EVALUATION_DECISION;
exports.ALL_EVALUATION_DECISIONS = ALL_EVALUATION_DECISIONS;
exports.MILESTONE_STATUS = MILESTONE_STATUS;
exports.ALL_MILESTONE_STATUSES = ALL_MILESTONE_STATUSES;
exports.ENDORSEMENT_STATUS = ENDORSEMENT_STATUS;
exports.ALL_ENDORSEMENT_STATUSES = ALL_ENDORSEMENT_STATUSES;
exports.TARGET_TYPE = TARGET_TYPE;
exports.ALL_TARGET_TYPES = ALL_TARGET_TYPES;
exports.NOTIFICATION_CHANNEL = NOTIFICATION_CHANNEL;
exports.ALL_NOTIFICATION_CHANNELS = ALL_NOTIFICATION_CHANNELS;
exports.NOTIFICATION_EVENT = NOTIFICATION_EVENT;
exports.NOTIFICATION_MATRIX = NOTIFICATION_MATRIX;
exports.CATEGORY_TYPE = CATEGORY_TYPE;
exports.ALL_CATEGORY_TYPES = ALL_CATEGORY_TYPES;
exports.QUORUM_TYPE = QUORUM_TYPE;
exports.ALL_QUORUM_TYPES = ALL_QUORUM_TYPES;
exports.AUDIT_ACTION = AUDIT_ACTION;
exports.FY_START_MONTH = FY_START_MONTH;
exports.getFYLabel = getFYLabel;
exports.getFYDateRange = getFYDateRange;
exports.SLA_BUSINESS_DAYS = SLA_BUSINESS_DAYS;
exports.SLA_AMBER_THRESHOLD_PCT = SLA_AMBER_THRESHOLD_PCT;
exports.SLA_RED_THRESHOLD_PCT = SLA_RED_THRESHOLD_PCT;
exports.UPLOAD_CONSTRAINTS = UPLOAD_CONSTRAINTS;
exports.EVIDENCE_REQUIRED_THRESHOLD_INR = EVIDENCE_REQUIRED_THRESHOLD_INR;
exports.PAGINATION = PAGINATION;
exports.AUTO_SAVE_INTERVAL_MS = AUTO_SAVE_INTERVAL_MS;
exports.MIN_CHARS = MIN_CHARS;

