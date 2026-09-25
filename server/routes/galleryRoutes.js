const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { authorize } = require('../middleware/auth');
const { ROLES } = require('../../shared/constants');

// Public endpoints (for authenticated users)
router.get('/', galleryController.getGallery);
router.get('/top-contributors', galleryController.getTopContributors);

// Admin only
router.use(authorize(ROLES.ADMIN));
router.post('/:id/unpublish', galleryController.unpublishIdea);

module.exports = router;
