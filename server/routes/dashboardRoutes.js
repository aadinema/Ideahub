/**
 * server/routes/dashboardRoutes.js
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/kpis',               dashboardController.getKPIs);
router.get('/featured-ideas',     dashboardController.getFeaturedIdeas);
router.get('/success-stories',    dashboardController.getSuccessStories);
router.get('/announcements',      dashboardController.getAnnouncements);
router.get('/department-targets', dashboardController.getDepartmentTargets);

module.exports = router;
