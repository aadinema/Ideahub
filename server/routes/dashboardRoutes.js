/**
 * server/routes/dashboardRoutes.js
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const ceoController = require('../controllers/ceoDashboardController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');

router.use(protect);

// Home dashboard (all authenticated users)
router.get('/kpis',               dashboardController.getKPIs);
router.get('/featured-ideas',     dashboardController.getFeaturedIdeas);
router.get('/success-stories',    dashboardController.getSuccessStories);
router.get('/announcements',      dashboardController.getAnnouncements);
router.get('/department-targets', dashboardController.getDepartmentTargets);

// ---------------------------------------------------------------------------
// CEO / C-Suite executive dashboard (CEO-01).
// Server-side authorization is mandatory — a manually crafted URL or token
// without the `ceo` role receives 403 regardless of what the frontend shows.
// ---------------------------------------------------------------------------
const ceoOnly = authorize(ROLES.CEO);

router.get('/ceo/overview', ceoOnly, ceoController.getOverview);
router.get('/ceo/trends',   ceoOnly, ceoController.getTrends);
router.get('/ceo/pipeline', ceoOnly, ceoController.getPipeline);
router.get('/ceo/insights', ceoOnly, ceoController.getInsights);

module.exports = router;
