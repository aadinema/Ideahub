const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');
const {
  adminUpdateUserSchema,
  handleValidationErrors,
  idParamSchema,
} = require('../utils/validators');

// All admin routes restricted to ADMIN role
router.use(authorize(ROLES.ADMIN));

// User Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', idParamSchema, adminUpdateUserSchema, handleValidationErrors, adminController.updateUserRole);
router.patch('/users/:id/deactivate', idParamSchema, handleValidationErrors, adminController.deactivateUser);

// Categories & Criteria
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.get('/criteria', adminController.getCriteria);
router.post('/criteria', adminController.updateCriteria);

// Targets
router.get('/targets', adminController.getTargets);
router.post('/targets', adminController.upsertTarget);

// System Config & Holidays
router.get('/config', adminController.getConfig);
router.patch('/config', adminController.updateConfig);
router.get('/holidays', adminController.getHolidays);
router.post('/holidays', adminController.addHoliday);

// Announcements
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.patch('/announcements/:id', idParamSchema, handleValidationErrors, adminController.updateAnnouncement);
router.delete('/announcements/:id', idParamSchema, handleValidationErrors, adminController.deleteAnnouncement);

// Audit Log Viewer
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
