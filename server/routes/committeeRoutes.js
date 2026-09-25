const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');

// All committee routes require INNOVATION_COMMITTEE or ADMIN role
router.use(authorize(ROLES.INNOVATION_COMMITTEE, ROLES.ADMIN));

router.get('/implementation-owners', committeeController.getImplementationOwners);
router.get('/ideas/:id/360-view', committeeController.get360View);
router.post('/ideas/:id/approve-publishing', committeeController.approvePublishing);
router.post('/ideas/:id/approve-implementation', committeeController.approveImplementation);
router.post('/ideas/:id/committee-reject', committeeController.rejectIdea);
router.post('/ideas/:id/defer', committeeController.deferIdea);

module.exports = router;
