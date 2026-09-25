/**
 * server/controllers/ideaController.js
 * Idea CRUD — FR-02 complete implementation.
 *
 * Endpoints:
 *   POST   /api/ideas                      → create draft or submit
 *   GET    /api/ideas                      → list (paginated, filtered)
 *   GET    /api/ideas/my                   → current user's ideas
 *   GET    /api/ideas/duplicate-check      → keyword similarity warning
 *   GET    /api/ideas/:id                  → single idea (role-aware)
 *   PATCH  /api/ideas/:id/draft            → auto-save draft (FR-02-05)
 *   POST   /api/ideas/:id/submit           → submit draft for review
 *   DELETE /api/ideas/:id                  → delete own draft only
 *
 * All mutating operations call auditService.log().
 * Status transitions go through workflowService only.
 * Notifications dispatched asynchronously after transitions.
 */
const Idea = require('../models/Idea');
const User = require('../models/User');
const IdeathonEvent = require('../models/IdeathonEvent');
const auditService = require('../services/auditService');
const workflowService = require('../services/workflowService');
const notificationService = require('../services/notificationService');
const storageService = require('../services/storageService');
const AppError = require('../utils/AppError');
const {
  IDEA_STATUS,
  ROLES,
  NOTIFICATION_EVENT,
  AUDIT_ACTION,
  PAGINATION,
  MIN_CHARS,
} = require('../../shared/constants');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip HTML tags for character-count validation on rich-text fields */
const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '').replace(/&\w+;/g, ' ').trim();

/** Build the attachment array from multer's req.files */
const buildAttachments = (files = []) =>
  files.map((file) => {
    const { url } = storageService.getFileInfo(file);
    return {
      fileName: file.originalname,
      url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedAt: new Date(),
    };
  });

// ---------------------------------------------------------------------------
// POST /api/ideas
// Create a new idea (starts as draft unless ?submit=true)
// ---------------------------------------------------------------------------
exports.createIdea = async (req, res, next) => {
  try {
    const body = req.body;
    const attachments = buildAttachments(req.files);

    // Validate problem statement length (strip HTML) — FR-02-02
    const problemText = stripHtml(body.problemStatement || '');
    if (body.status !== IDEA_STATUS.DRAFT && problemText.length < MIN_CHARS.PROBLEM_STATEMENT) {
      return next(
        new AppError(
          `Problem statement must be at least ${MIN_CHARS.PROBLEM_STATEMENT} characters (FR-02-02).`,
          422
        )
      );
    }

    // Validate linked event is active (if provided) — FR-02-07
    if (body.linkedEventId) {
      const event = await IdeathonEvent.findById(body.linkedEventId);
      if (!event || event.status !== 'active') {
        return next(new AppError('Selected Ideathon event is not currently active.', 400));
      }
      if (event.endDate < new Date()) {
        return next(new AppError('Idea submission for this event has closed (FR-IE-06).', 400));
      }
    }

    // Get submitter's supervisor
    const submitter = await User.findById(req.user._id);
    const supervisorId = submitter.managerId || null;

    const idea = await Idea.create({
      title: body.title,
      category: body.category,
      ideaType: body.ideaType,
      department: body.department || req.user.department,
      initiative: body.initiative,
      keywords: Array.isArray(body.keywords)
        ? body.keywords
        : (body.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
      problemStatement: body.problemStatement,
      currentChallenges: body.currentChallenges,
      proposedSolution: body.proposedSolution,
      innovationDescription: body.innovationDescription,
      expectedOutcome: body.expectedOutcome,
      benefitTypes: Array.isArray(body.benefitTypes)
        ? body.benefitTypes
        : [body.benefitTypes].filter(Boolean),
      attachments,
      linkedEventId: body.linkedEventId || null,
      submittedBy: req.user._id,
      supervisorId,
      status: IDEA_STATUS.DRAFT,
      isDraftAutoSaved: false,
    });

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityType: 'Idea',
      entityId: idea._id.toString(),
      afterState: { title: idea.title, status: idea.status },
      ipAddress: req.ip,
    });

    // If ?submit=true, immediately submit
    if (req.query.submit === 'true') {
      await _submitIdea(idea, req.user, req.ip);
    }

    res.status(201).json({
      success: true,
      data: idea,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/ideas — paginated, filtered list
// ---------------------------------------------------------------------------
exports.getIdeas = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      department,
      linkedEventId,
      category,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (linkedEventId) filter.linkedEventId = linkedEventId;
    if (category) filter.category = category;

    // Non-admin employees see only their own ideas + published
    if (!req.user.roles.includes(ROLES.ADMIN) && !req.user.roles.includes(ROLES.INNOVATION_COMMITTEE)) {
      const orConditions = [
        { submittedBy: req.user._id },
        { status: IDEA_STATUS.PUBLISHED },
      ];

      if (req.user.roles.includes(ROLES.SUPERVISOR)) {
        // Supervisors see their team's ideas
        const teamMembers = await User.find({ managerId: req.user._id }).select('_id').lean();
        const teamIds = teamMembers.map((u) => u._id);
        orConditions.push({ submittedBy: { $in: teamIds } });
      }
      
      if (req.user.roles.includes(ROLES.DEPT_INNOVATION_TEAM)) {
        orConditions.push({ 
          department: req.user.department, 
          status: { $in: [
            IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION,
            IDEA_STATUS.SHORTLISTED,
            IDEA_STATUS.REJECTED_BY_DEPT,
          ]}
        });
        orConditions.push({ assignedEvaluators: req.user._id });
      }

      filter.$or = orConditions;
    }

    const [ideas, total] = await Promise.all([
      Idea.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('submittedBy', 'name employeeId department')
        .populate('supervisorId', 'name')
        .populate('linkedEventId', 'eventName')
        .populate('assignedEvaluators', 'name')
        .lean(),
      Idea.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: ideas,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/ideas/my — current user's ideas only
// ---------------------------------------------------------------------------
exports.getMyIdeas = async (req, res, next) => {
  try {
    const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { submittedBy: req.user._id };
    if (status) filter.status = status;

    const [ideas, total] = await Promise.all([
      Idea.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('linkedEventId', 'eventName')
        .lean(),
      Idea.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: ideas,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/ideas/duplicate-check?title=...&keywords=...
// Simple text-similarity check — warns but never blocks (FR-02-06)
// Uses MongoDB text index for fast matching
// ---------------------------------------------------------------------------
exports.duplicateCheck = async (req, res, next) => {
  try {
    const { title = '', keywords = '' } = req.query;
    if (!title && !keywords) {
      return res.status(200).json({ success: true, data: [], hasDuplicates: false });
    }

    // Build text search query from title + keywords
    const searchText = [title, keywords].filter(Boolean).join(' ');

    const similarIdeas = await Idea.find(
      { $text: { $search: searchText }, status: { $ne: IDEA_STATUS.DRAFT } },
      { score: { $meta: 'textScore' }, title: 1, ideaId: 1, status: 1, submittedBy: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .populate('submittedBy', 'name')
      .lean();

    // Only flag as duplicates if text score > threshold
    const SIMILARITY_THRESHOLD = 0.5;
    const potentialDuplicates = similarIdeas.filter((i) => (i.score || 0) >= SIMILARITY_THRESHOLD);

    res.status(200).json({
      success: true,
      hasDuplicates: potentialDuplicates.length > 0,
      data: potentialDuplicates.map((i) => ({
        _id: i._id,
        ideaId: i.ideaId,
        title: i.title,
        status: i.status,
        submittedBy: i.submittedBy?.name,
        similarityScore: i.score,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/ideas/:id — single idea (role-aware field visibility)
// ---------------------------------------------------------------------------
exports.getIdeaById = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('submittedBy', 'name email employeeId department designation')
      .populate('supervisorId', 'name email')
      .populate('linkedEventId', 'eventName theme endDate')
      .populate('statusHistory.actor', 'name roles')
      .lean();

    if (!idea) return next(new AppError('Idea not found', 404));

    // Access control: non-admins/committee can only see own or published ideas
    const canViewAll =
      req.user.roles.includes(ROLES.ADMIN) ||
      req.user.roles.includes(ROLES.INNOVATION_COMMITTEE) ||
      req.user.roles.includes(ROLES.DEPT_INNOVATION_TEAM);

    const isOwn = idea.submittedBy?._id?.toString() === req.user._id.toString();
    const isSupervisor = idea.supervisorId?._id?.toString() === req.user._id.toString();
    const isPublished = idea.status === IDEA_STATUS.PUBLISHED;

    if (!canViewAll && !isOwn && !isSupervisor && !isPublished) {
      return next(new AppError('You do not have access to view this idea.', 403));
    }

    res.status(200).json({ success: true, data: idea });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/ideas/:id/draft — auto-save (FR-02-05)
// No full validation — partial update allowed for drafts
// ---------------------------------------------------------------------------
exports.autoSaveDraft = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.submittedBy.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only auto-save your own ideas.', 403));
    }
    if (idea.status !== IDEA_STATUS.DRAFT) {
      return next(new AppError('Only drafts can be auto-saved.', 400));
    }

    // Allow partial field updates — only update provided fields
    const allowedFields = [
      'title', 'category', 'ideaType', 'department', 'initiative', 'keywords',
      'problemStatement', 'currentChallenges', 'proposedSolution',
      'innovationDescription', 'expectedOutcome', 'benefitTypes', 'linkedEventId',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        idea[field] = req.body[field];
      }
    });

    idea.isDraftAutoSaved = true;
    idea.lastAutoSavedAt = new Date();

    await idea.save({ validateBeforeSave: false }); // skip full validation on auto-save

    res.status(200).json({
      success: true,
      message: 'Draft auto-saved',
      data: { lastAutoSavedAt: idea.lastAutoSavedAt },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ideas/:id/submit — submit a draft for supervisor review
// ---------------------------------------------------------------------------
exports.submitIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.submittedBy.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only submit your own ideas.', 403));
    }
    if (idea.status !== IDEA_STATUS.DRAFT && idea.status !== IDEA_STATUS.RETURNED) {
      return next(
        new AppError(
          `Only draft or returned ideas can be submitted. Current status: ${idea.status}.`,
          400
        )
      );
    }

    // Full validation before submission
    const problemText = stripHtml(idea.problemStatement || '');
    if (problemText.length < MIN_CHARS.PROBLEM_STATEMENT) {
      return next(
        new AppError(
          `Problem statement must be at least ${MIN_CHARS.PROBLEM_STATEMENT} characters (FR-02-02).`,
          422
        )
      );
    }
    if (!idea.benefitTypes || idea.benefitTypes.length === 0) {
      return next(new AppError('At least one benefit type is required (FR-02-03).', 422));
    }
    if (!idea.title || !idea.category || !idea.department) {
      return next(new AppError('Title, category, and department are required.', 422));
    }

    await _submitIdea(idea, req.user, req.ip);

    res.status(200).json({
      success: true,
      message: 'Idea submitted successfully.',
      data: { ideaId: idea.ideaId, status: idea.status },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/ideas/:id — delete own draft only
// ---------------------------------------------------------------------------
exports.deleteIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    const isOwn = idea.submittedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);

    if (!isOwn && !isAdmin) {
      return next(new AppError('You can only delete your own ideas.', 403));
    }
    if (!isAdmin && idea.status !== IDEA_STATUS.DRAFT) {
      return next(new AppError('Only draft ideas can be deleted.', 400));
    }

    const snapshot = idea.toObject();
    await Idea.findByIdAndDelete(idea._id);

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.DELETE,
      entityType: 'Idea',
      entityId: idea._id.toString(),
      beforeState: { title: snapshot.title, status: snapshot.status },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Idea deleted.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ideas/:id/publish — admin publishes an approved idea to the gallery
// ---------------------------------------------------------------------------
exports.publishIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.status !== IDEA_STATUS.APPROVED_FOR_PUBLISHING) {
      return next(
        new AppError(
          `Only ideas approved for publishing can be published. Current status: ${idea.status}.`,
          400
        )
      );
    }

    // workflowService sets publishedAt and writes statusHistory + AuditLog.
    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.PUBLISHED,
      actor: req.user,
      comment: req.body.comment,
      ipAddress: req.ip,
    });

    // Notify submitter their idea is live in the gallery.
    const submitter = await User.findById(idea.submittedBy).lean();
    if (submitter) {
      notificationService.trigger(NOTIFICATION_EVENT.PUBLISHED_TO_GALLERY, { idea, submitter });
    }

    res.status(200).json({
      success: true,
      message: 'Idea published to the gallery.',
      data: { ideaId: idea.ideaId, status: idea.status },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Internal: submit an idea through the workflow + notify
// ---------------------------------------------------------------------------
const _submitIdea = async (idea, actor, ipAddress) => {
  // Transition: draft/returned → submitted
  await workflowService.transition({
    idea,
    toStatus: IDEA_STATUS.SUBMITTED,
    actor,
    ipAddress,
  });

  // Transition: submitted → under_supervisor_review (automated)
  await workflowService.transition({
    idea,
    toStatus: IDEA_STATUS.UNDER_SUPERVISOR_REVIEW,
    actor: { _id: actor._id, roles: ['system'] },
    ipAddress,
  });

  // Notify submitter (FR-02-08)
  const submitter = await User.findById(idea.submittedBy).lean();
  notificationService.trigger(NOTIFICATION_EVENT.IDEA_SUBMITTED, { idea, submitter });

  // Notify supervisor (FR-03-01) — within 5 min (async, immediate)
  if (idea.supervisorId) {
    const supervisor = await User.findById(idea.supervisorId).lean();
    if (supervisor) {
      notificationService.trigger(NOTIFICATION_EVENT.ASSIGNED_FOR_SUPERVISOR_REVIEW, {
        idea,
        supervisor,
      });
    }
  }
};
