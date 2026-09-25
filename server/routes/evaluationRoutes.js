const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');

// All evaluation routes require DEPT_INNOVATION_TEAM or ADMIN role
// Note: Committee can also view evaluations, but they use the 360-view endpoint for that.
router.use(authorize(ROLES.DEPT_INNOVATION_TEAM, ROLES.ADMIN));

router.get('/criteria', evaluationController.getActiveCriteria);
router.post('/', evaluationController.submitEvaluation);
router.get('/idea/:ideaId', evaluationController.getEvaluationsByIdea);

router.post('/ideas/:id/shortlist', evaluationController.shortlistIdea);
router.post('/ideas/:id/reject-dept', evaluationController.rejectIdea);

module.exports = router;
