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
    .isIn(['Process Improvement', 'Cost Reduction', 'Revenue Growth', 'Innovation', 'Customer Experience', 'Employee Experience', 'Sustainability'])
    .withMessage('Invalid category'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ max: 100 })
    .withMessage('Department too long'),
  body('problemStatement')
    .trim()
    .notEmpty()
    .withMessage('Problem statement is required')
    .isLength({ min: 50, max: 2000 })
    .withMessage('Problem statement must be between 50 and 2000 characters'),
  body('proposedSolution')
    .trim()
    .notEmpty()
    .withMessage('Proposed solution is required')
    .isLength({ min: 50, max: 2000 })
    .withMessage('Proposed solution must be between 50 and 2000 characters'),
  body('expectedBenefits')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Expected benefits too long'),
  body('implementationChallenges')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Implementation challenges too long'),
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
    .isIn(['Process Improvement', 'Cost Reduction', 'Revenue Growth', 'Innovation', 'Customer Experience', 'Employee Experience', 'Sustainability'])
    .withMessage('Invalid category'),
  body('problemStatement')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Problem statement must be between 50 and 2000 characters'),
  body('proposedSolution')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Proposed solution must be between 50 and 2000 characters'),
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
      const validRoles = ['admin', 'employee', 'supervisor', 'evaluator', 'committee'];
      if (!roles.every(r => validRoles.includes(r))) {
        throw new Error('Invalid role(s)');
      }
      return true;
    }),
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
      if (!acc[err.param]) acc[err.param] = [];
      acc[err.param].push(err.msg);
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

  // Admin
  adminUpdateUserSchema,
};
