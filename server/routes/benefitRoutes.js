const express = require('express');
const router = express.Router();
const benefitController = require('../controllers/benefitController');
const { uploadEvidence } = require('../middleware/upload');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');
const {
  benefitCreateSchema,
  handleValidationErrors,
  idParamSchema,
} = require('../utils/validators');

router.get('/ideas/:ideaId', benefitController.getBenefitByIdea);
router.post('/', uploadEvidence, benefitCreateSchema, handleValidationErrors, benefitController.createBenefit);
router.patch('/:id/endorse', authorize(ROLES.ADMIN, ROLES.INNOVATION_COMMITTEE), idParamSchema, handleValidationErrors, benefitController.endorseBenefit);

module.exports = router;
