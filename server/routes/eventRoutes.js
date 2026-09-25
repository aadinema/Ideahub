const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');

// Publicly available (to authenticated users)
router.get('/explore', eventController.exploreEvents);
router.post('/:id/join', eventController.joinEvent);
router.get('/:id/leaderboard', eventController.getLeaderboard);
router.get('/:id', eventController.getEventById);

// Admin only routes for managing events
router.use(authorize(ROLES.ADMIN));
router.post('/', eventController.createEvent);
router.patch('/:id', eventController.updateEvent);
router.post('/:id/extend', eventController.extendEvent);

module.exports = router;
