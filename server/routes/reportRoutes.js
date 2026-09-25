const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');

// Reporting is restricted to leadership roles — prevents ordinary employees
// from reading org-wide analytics or exporting bulk data.
const reportViewers = authorize(
  ROLES.ADMIN,
  ROLES.INNOVATION_COMMITTEE,
  ROLES.DEPT_INNOVATION_TEAM
);

router.get('/dashboard', reportViewers, reportController.getDashboardReport);
router.get('/department-targets', reportViewers, reportController.getDepartmentTargetsReport);
router.get('/sla-performance', reportViewers, reportController.getSlaPerformanceReport);
router.get('/export', authorize(ROLES.ADMIN, ROLES.INNOVATION_COMMITTEE), reportController.exportReport);

module.exports = router;
