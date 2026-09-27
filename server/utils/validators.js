/**
 * server/utils/validators.js
 * Reusable express-validator schemas for common patterns across routes.
 *
 * Usage:
 *  const { Router } = require('express');
 *  const { idParamSchema, ideaCreateSchema } = require('../utils/validators');
 *  const { validationResult } = require('express-validator');
 *
 *  router.post('/ideas', ideaCreateSchema, (req, res, next) => {
 *    const errors = validationResult(req);
 *    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
 *    // proceed
 *  });
 */

const { param, body, query, validationResult } = require('express-validator');
const {
  ALL_ROLES,
  ALL_EVENT_TYPES,
  ALL_EVENT_VISIBILITIES,
  ALL_EVENT_STATUSES,
} = require('../../shared/constants');
const AppError = require('./AppError');

// ---------------------------------------------------------------------------
// Common patterns
// ---------------------------------------------------------------------------

const idParamSchema = param('id')
  .isMongoId()
  .withMessage('Invalid ID format');

const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// ---------------------------------------------------------------------------
// Ideas routes
// ---------------------------------------------------------------------------

const ideaCreateSchema = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 100 })
    .withMessage('Category too long'),
  body('ideaType')
    .optional()
    .trim()
    .isIn(['incremental', 'radical', 'disruptive', 'architectural'])
    .withMessage('Invalid idea type'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ max: 100 })
    .withMessage('Department too long'),
  body('initiative')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Initiative too long'),
  body('keywords')
    .optional()
    .custom((value) => {
      // Accept both string (comma-separated) and array
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) return true;
      throw new Error('Keywords must be a string or array');
    }),
  body('problemStatement')
    .trim()
    .notEmpty()
    .withMessage('Problem statement is required')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Problem statement must be between 50 and 5000 characters'),
  body('currentChallenges')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Current challenges too long'),
  body('proposedSolution')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Proposed solution too long'),
  body('innovationDescription')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Innovation description too long'),
  body('expectedOutcome')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Expected outcome too long'),
  body('benefitTypes')
    .isArray({ min: 1 })
    .withMessage('At least one benefit type is required (FR-02-03)')
    .custom((arr) => {
      const validTypes = [
        'cost_reduction',
        'time_savings',
        'automation',
        'customer_experience',
        'revenue_generation',
        'employee_satisfaction',
        'compliance_improvement',
        'process_optimization',
      ];
      if (!arr.every((v) => validTypes.includes(v))) {
        throw new Error('Invalid benefit type(s)');
      }
      return true;
    }),
  body('estimatedValueINR')
    .optional({ values: 'null' })
    .trim()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = Number(value);
      if (Number.isNaN(num) || num < 0) {
        throw new Error('Estimated value must be a number of 0 or more');
      }
      return true;
    }),
  body('linkedEventId')
    .optional({ values: 'falsy' })
    .isMongoId()
    .withMessage('Invalid event ID'),
];

const ideaUpdateSchema = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category too long'),
  body('ideaType')
    .optional()
    .trim()
    .isIn(['incremental', 'radical', 'disruptive', 'architectural'])
    .withMessage('Invalid idea type'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department too long'),
  body('initiative')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Initiative too long'),
  body('keywords')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) return true;
      throw new Error('Keywords must be a string or array');
    }),
  body('problemStatement')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Problem statement must be between 50 and 5000 characters'),
  body('currentChallenges')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Current challenges too long'),
  body('proposedSolution')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Proposed solution too long'),
  body('innovationDescription')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Innovation description too long'),
  body('expectedOutcome')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Expected outcome too long'),
  body('benefitTypes')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one benefit type is required')
    .custom((arr) => {
      const validTypes = [
        'cost_reduction',
        'time_savings',
        'automation',
        'customer_experience',
        'revenue_generation',
        'employee_satisfaction',
        'compliance_improvement',
        'process_optimization',
      ];
      if (!arr.every((v) => validTypes.includes(v))) {
        throw new Error('Invalid benefit type(s)');
      }
      return true;
    }),
  body('estimatedValueINR')
    .optional({ values: 'null' })
    .trim()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = Number(value);
      if (Number.isNaN(num) || num < 0) {
        throw new Error('Estimated value must be a number of 0 or more');
      }
      return true;
    }),
  body('linkedEventId')
    .optional({ values: 'falsy' })
    .isMongoId()
    .withMessage('Invalid event ID'),
];

// ---------------------------------------------------------------------------
// Implementation routes
// ---------------------------------------------------------------------------

const implementationCreateSchema = [
  body('ideaId')
    .isMongoId()
    .withMessage('Invalid idea ID'),
  body('ownerId')
    .isMongoId()
    .withMessage('Invalid owner ID'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department too long'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('targetCompletionDate')
    .isISO8601()
    .withMessage('Target completion date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Target completion date must be after start date');
      }
      return true;
    }),
  body('progressPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress percent must be between 0 and 100'),
];

const implementationUpdateSchema = [
  body('progressPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress percent must be between 0 and 100'),
  body('status')
    .optional()
    .trim()
    .isIn(['In Progress', 'On Hold', 'Completed', 'Cancelled'])
    .withMessage('Invalid status'),
  body('milestone')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Milestone description too long'),
];

// ---------------------------------------------------------------------------
// Benefit routes
// ---------------------------------------------------------------------------

const benefitCreateSchema = [
  body('ideaId')
    .isMongoId()
    .withMessage('Invalid idea ID'),
  body('implementationId')
    .isMongoId()
    .withMessage('Invalid implementation ID'),
  body('financial.costSavingsINR')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cost savings must be a non-negative integer'),
  body('financial.revenueIncreaseINR')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Revenue increase must be a non-negative integer'),
  body('operational.description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 1000 })
    .withMessage('Operational benefit description must be between 50 and 1000 characters'),
  body('operational.efficiencyImprovementPct')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Efficiency improvement must be between 0 and 100'),
  body('operational.productivityGainPct')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Productivity gain must be between 0 and 100'),
];

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------

const adminUpdateUserSchema = [
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array')
    .custom((roles) => {
      // Validate against the shared source of truth (ALL_ROLES) so this
      // never drifts from the User model enum (e.g. previously listed role
      // names that don't exist, and missed newly added roles like 'ceo').
      if (!roles.every((r) => ALL_ROLES.includes(r))) {
        throw new Error('Invalid role(s)');
      }
      return true;
    }),
];

// ---------------------------------------------------------------------------
// Events routes — FR-IE-01 (create fields), FR-IE-02 (visibility), FR-IE-07 (extend)
// ---------------------------------------------------------------------------

const EVENT_TYPE_MSG = 'Invalid event type';
const EVENT_VISIBILITY_MSG = 'Invalid event visibility';
const EVENT_STATUS_MSG = 'Invalid event status';

// FR-IE-01 — end date must never precede start date.
const endDateAfterStartDate = (value, { req }) => {
  const start = req.body && req.body.startDate;
  if (start && new Date(value) < new Date(start)) {
    throw new Error('End date must be on or after start date (FR-IE-01)');
  }
  return true;
};

// Always-optional fields shared by create (FR-IE-01) and update.
const optionalEventFields = [
  body('theme').optional().trim().isLength({ max: 300 }).withMessage('Theme too long'),
  body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
  body('initiative').optional().trim().isLength({ max: 200 }).withMessage('Initiative too long'),
  body('ideaCategory').optional().trim().isLength({ max: 200 }).withMessage('Category too long'),
  body('targetDepartments').optional().isArray().withMessage('Target departments must be an array'),
  body('targetDepartments.*').optional().isString().trim(),
  body('maxParticipants').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
  body('visibility').optional().isIn(ALL_EVENT_VISIBILITIES).withMessage(EVENT_VISIBILITY_MSG),
  body('status').optional().isIn(ALL_EVENT_STATUSES).withMessage(EVENT_STATUS_MSG),
  body('minQualifyingScore').optional().isFloat({ min: 0, max: 10 }).withMessage('Minimum qualifying score must be between 0 and 10'),
  body('quorumType').optional().isIn(['majority', 'fixed_count']).withMessage('Invalid quorum type'),
  body('quorumValue').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Quorum value must be at least 1'),
];

const eventCreateSchema = [
  body('eventName').trim().notEmpty().withMessage('Event name is required').isLength({ max: 300 }).withMessage('Event name too long'),
  body('eventType').isIn(ALL_EVENT_TYPES).withMessage(EVENT_TYPE_MSG),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date').custom(endDateAfterStartDate),
  ...optionalEventFields,
];

const eventUpdateSchema = [
  body('eventName').optional().trim().notEmpty().withMessage('Event name cannot be empty').isLength({ max: 300 }).withMessage('Event name too long'),
  body('eventType').optional().isIn(ALL_EVENT_TYPES).withMessage(EVENT_TYPE_MSG),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date').custom(endDateAfterStartDate),
  ...optionalEventFields,
];

const eventExtendSchema = [
  body('newEndDate').isISO8601().withMessage('New end date must be a valid date'),
  body('justification').trim().isLength({ min: 20 }).withMessage('Extension justification must be at least 20 characters (FR-IE-07)'),
];

// ---------------------------------------------------------------------------
// Middleware to handle validation errors
// ---------------------------------------------------------------------------

/**
 * Express middleware to catch and format validation errors.
 * Responds with 422 Unprocessable Entity if validation fails.
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = errors.array().reduce((acc, err) => {
      const field = err.path || err.param || 'unknown';
      if (!acc[field]) acc[field] = [];
      acc[field].push(err.msg);
      return acc;
    }, {});
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: fieldErrors,
    });
  }
  next();
};

module.exports = {
  // Common
  idParamSchema,
  paginationQuery,
  handleValidationErrors,
  validationResult,

  // Ideas
  ideaCreateSchema,
  ideaUpdateSchema,

  // Implementation
  implementationCreateSchema,
  implementationUpdateSchema,

  // Benefits
  benefitCreateSchema,

  // Events — FR-IE-01/02/07
  eventCreateSchema,
  eventUpdateSchema,
  eventExtendSchema,

  // Admin
  adminUpdateUserSchema,
};
