/**
 * server/controllers/galleryController.js
 * Publishing and Innovation Gallery (Phase 4).
 * FR-06
 */
const Idea = require('../models/Idea');
const workflowService = require('../services/workflowService');
const AppError = require('../utils/AppError');
const { IDEA_STATUS, PAGINATION } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// GET /api/gallery
// Publicly accessible gallery (authenticated users).
// Full-text search and multi-filters.
// ---------------------------------------------------------------------------
exports.getGallery = async (req, res, next) => {
  try {
    const { 
      q, // Search keyword
      category,
      department,
      ideaType,
      page = 1,
      limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const query = { status: IDEA_STATUS.PUBLISHED };

    // Full text search
    if (q) {
      query.$text = { $search: q };
    }

    if (category) query.category = category;
    if (department) query.department = department;
    if (ideaType) query.ideaType = ideaType;

    const skip = (page - 1) * limit;
    
    // Sort logic: if searching, sort by text match score. Otherwise, by newest published.
    const sort = q ? { score: { $meta: 'textScore' } } : { updatedAt: -1 };
    const projection = q ? { score: { $meta: 'textScore' } } : {};

    const ideas = await Idea.find(query, projection)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('submittedBy', 'name department')
      .lean();

    const total = await Idea.countDocuments(query);

    res.status(200).json({
      success: true,
      data: ideas,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/gallery/top-contributors
// Gets the leaderboard of top contributors based on published ideas.
// ---------------------------------------------------------------------------
exports.getTopContributors = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const pipeline = [
      { $match: { status: IDEA_STATUS.PUBLISHED } },
      { $group: { _id: '$submittedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
      }},
      { $unwind: '$user' },
      { $project: {
          _id: 1,
          count: 1,
          name: '$user.name',
          department: '$user.department'
      }}
    ];

    const leaderboard = await Idea.aggregate(pipeline);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/gallery/:id/unpublish
// Admin only. Unpublishes an idea and reverts it to a previous state.
// ---------------------------------------------------------------------------
exports.unpublishIdea = async (req, res, next) => {
  try {
    const { justification } = req.body;

    if (!justification || justification.trim().length < 20) {
      return next(new AppError('Unpublish justification must be at least 20 characters.', 422));
    }

    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.status !== IDEA_STATUS.PUBLISHED) {
      return next(new AppError('Only published ideas can be unpublished.', 400));
    }

    // There is no PUBLISHED → APPROVED_FOR_PUBLISHING edge in STATUS_TRANSITIONS,
    // so unpublishing is an admin override back to the pre-publish state.
    // workflowService writes statusHistory + AuditLog (ADMIN_OVERRIDE) for us.
    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.APPROVED_FOR_PUBLISHING,
      actor: req.user,
      comment: `Unpublished from gallery: ${justification.trim()}`,
      isAdminOverride: true,
      overrideReason: justification.trim(),
      ipAddress: req.ip,
    });

    // Clear publish-only flags so it leaves the gallery immediately.
    idea.publishedAt = null;
    idea.isFeatured = false;
    await idea.save();

    res.status(200).json({ success: true, message: 'Idea unpublished successfully.' });
  } catch (err) {
    next(err);
  }
};
