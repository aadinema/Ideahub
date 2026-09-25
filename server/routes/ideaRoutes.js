/**
 * server/routes/ideaRoutes.js
 * All idea endpoints — RBAC enforced per route.
 */
const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/ideaController');
const { protect, authorize } = require('../middleware/auth');
const { uploadAttachments } = require('../middleware/upload');
const { ROLES } = require('../../shared/constants');
const {
  ideaCreateSchema,
  ideaUpdateSchema,
  handleValidationErrors,
  idParamSchema,
  paginationQuery,
} = require('../utils/validators');

const { EMPLOYEE, SUPERVISOR, DEPT_INNOVATION_TEAM, INNOVATION_COMMITTEE, ADMIN } = ROLES;

// All idea routes require authentication
router.use(protect);

// Duplicate check — any authenticated user
router.get('/duplicate-check', ideaController.duplicateCheck);

// My ideas — any authenticated user
router.get('/my', ideaController.getMyIdeas);

// List ideas — role-filtered in controller
router.get('/', paginationQuery, handleValidationErrors, ideaController.getIdeas);

// Create idea (with optional file attachments) — any employee+
router.post(
  '/',
  authorize(EMPLOYEE, SUPERVISOR, DEPT_INNOVATION_TEAM, INNOVATION_COMMITTEE, ADMIN),
  uploadAttachments,
  ideaCreateSchema,
  handleValidationErrors,
  ideaController.createIdea
);

// Single idea — role-aware visibility in controller
router.get('/:id', idParamSchema, handleValidationErrors, ideaController.getIdeaById);

// Auto-save draft — owner only (enforced in controller)
router.patch('/:id/draft', idParamSchema, ideaUpdateSchema, handleValidationErrors, ideaController.autoSaveDraft);

// Submit idea — owner only (enforced in controller)
router.post('/:id/submit', idParamSchema, handleValidationErrors, ideaController.submitIdea);

// Publish an approved idea to the gallery — admin only
router.post('/:id/publish', authorize(ADMIN), idParamSchema, handleValidationErrors, ideaController.publishIdea);

// Delete draft — owner or admin (enforced in controller)
router.delete('/:id', idParamSchema, handleValidationErrors, ideaController.deleteIdea);

module.exports = router;
