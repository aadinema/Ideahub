const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');
const {
  eventCreateSchema,
  eventUpdateSchema,
  eventExtendSchema,
  idParamSchema,
  handleValidationErrors,
} = require('../utils/validators');

// ---------------------------------------------------------------------------
// Authenticated (all roles) — employee-facing event discovery & registration.
// NOTE: static paths (/explore, /mine, /facets) are declared before the
// dynamic /:id route so they are not captured as an event id.
// ---------------------------------------------------------------------------
router.get('/explore', eventController.exploreEvents);
router.get('/mine', eventController.getMyEvents);
router.get('/facets', eventController.getEventFacets);
router.post('/:id/join', idParamSchema, handleValidationErrors, eventController.joinEvent);
router.get('/:id/leaderboard', idParamSchema, handleValidationErrors, eventController.getLeaderboard);
router.get('/:id', idParamSchema, handleValidationErrors, eventController.getEventById);

// ---------------------------------------------------------------------------
// Admin only — event management (FR-IE-01/02/07, FR-AD-03)
// ---------------------------------------------------------------------------
router.use(authorize(ROLES.ADMIN));

router.get('/', eventController.listEvents);
router.post('/', eventCreateSchema, handleValidationErrors, eventController.createEvent);
router.patch('/:id', eventUpdateSchema, handleValidationErrors, eventController.updateEvent);
router.post('/:id/extend', eventExtendSchema, handleValidationErrors, eventController.extendEvent);
router.post('/:id/close', idParamSchema, handleValidationErrors, eventController.closeEvent);

module.exports = router;
