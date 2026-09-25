const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');

// All supervisor routes require the SUPERVISOR or ADMIN role
router.use(authorize(ROLES.SUPERVISOR, ROLES.ADMIN));

router.get('/queue', supervisorController.getQueue);
router.post('/ideas/:id/approve', supervisorController.approveIdea);
router.post('/ideas/:id/reject', supervisorController.rejectIdea);
router.post('/ideas/:id/return', supervisorController.returnIdea);

module.exports = router;
