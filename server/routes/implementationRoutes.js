const express = require('express');
const router = express.Router();
const implementationController = require('../controllers/implementationController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');
const {
  implementationCreateSchema,
  implementationUpdateSchema,
  handleValidationErrors,
  idParamSchema,
  paginationQuery,
} = require('../utils/validators');

const { param } = require('express-validator');

router.get('/my', paginationQuery, handleValidationErrors, implementationController.getMyImplementations);
router.get('/ideas/:ideaId', param('ideaId').isMongoId().withMessage('Invalid idea ID'), handleValidationErrors, implementationController.getImplementationByIdea);

router.post('/', authorize(ROLES.ADMIN, ROLES.INNOVATION_COMMITTEE), implementationCreateSchema, handleValidationErrors, implementationController.createImplementation);
router.patch('/:id', idParamSchema, implementationUpdateSchema, handleValidationErrors, implementationController.updateImplementation);

module.exports = router;
