/**
 * server/controllers/implementationController.js
 * Implementation tracking (Phase 5).
 * FR-07
 */
const Implementation = require('../models/Implementation');
const Idea = require('../models/Idea');
const auditService = require('../services/auditService');
const authorizationService = require('../services/authorizationService');
const workflowService = require('../services/workflowService');
const AppError = require('../utils/AppError');
const notificationService = require('../services/notificationService');
const { IDEA_STATUS, AUDIT_ACTION, ROLES, NOTIFICATION_EVENT } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// POST /api/implementations
// Create implementation record after committee approves for implementation.
// Advances the idea APPROVED_FOR_IMPLEMENTATION → IMPLEMENTATION_INITIATED.
// Authorization: only admin and committee can create (enforced at route level)
// ---------------------------------------------------------------------------
exports.createImplementation = async (req, res, next) => {
  try {
    const { ideaId, ownerId, department, startDate, targetCompletionDate, milestones } = req.body;

    const idea = await Idea.findById(ideaId);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.status !== IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION) {
      return next(
        new AppError(
          'An implementation record can only be created for an idea approved for implementation.',
          400
        )
      );
    }

    // Check if implementation record already exists
    const existing = await Implementation.findOne({ ideaId });
    if (existing) {
      return next(new AppError('Implementation record already exists for this idea.', 400));
    }

    // Validate the owner exists, is active, and is eligible
    const owner = await authorizationService.validateImplementationOwner(
      ownerId,
      department || idea.department
    );

    const implementation = await Implementation.create({
      ideaId,
      ownerId,
      department: department || idea.department,
      startDate: new Date(startDate),
      targetCompletionDate: new Date(targetCompletionDate),
      milestones: milestones || [],
    });

    // Advance idea status through the workflow (writes statusHistory + AuditLog).
    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.IMPLEMENTATION_INITIATED,
      actor: req.user,
      comment: 'Implementation record created and owner assigned.',
      ipAddress: req.ip,
    });

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityType: 'Implementation',
      entityId: implementation._id.toString(),
      metadata: { ideaId, ownerId }
    });

    // Notify owner + submitter of the assignment.
    const [notifiedOwner, submitter] = await Promise.all([
      require('../models/User').findById(ownerId).lean(),
      require('../models/User').findById(idea.submittedBy).lean(),
    ]);
    if (notifiedOwner && submitter) {
      notificationService.trigger(NOTIFICATION_EVENT.IMPLEMENTATION_ASSIGNED, {
        idea,
        owner: notifiedOwner,
        submitter,
      });
    }

    res.status(201).json({ success: true, data: implementation });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/implementations/my
// Get implementation tasks assigned to current user
// ---------------------------------------------------------------------------
exports.getMyImplementations = async (req, res, next) => {
  try {
    const implementations = await Implementation.find({ ownerId: req.user._id })
      .populate('ideaId', 'title ideaId category status department')
      .sort({ targetCompletionDate: 1 })
      .lean();

    res.status(200).json({ success: true, data: implementations });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/implementations/ideas/:ideaId
// Get implementation details for an idea
// Authorization: caller must have access to the idea or be the implementation owner
// ---------------------------------------------------------------------------
exports.getImplementationByIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.ideaId);
    if (!idea) {
      return next(new AppError('Idea not found', 404));
    }

    const implementation = await Implementation.findOne({ ideaId: req.params.ideaId })
      .populate('ideaId', 'title ideaId category status department')
      .populate('ownerId', 'name department email')
      .lean();

    if (!implementation) {
      return next(new AppError('No implementation record found for this idea.', 404));
    }

    // Authorization: caller must be able to access the implementation
    const canAccess = await authorizationService.canAccessImplementation(
      req.user,
      implementation,
      idea,
      'read'
    );
    if (!canAccess) {
      return next(new AppError('Access denied to this implementation', 403));
    }

    res.status(200).json({ success: true, data: implementation });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/implementations/:id
// Update progress percent, milestone status/notes (Owner or Admin)
// ---------------------------------------------------------------------------
exports.updateImplementation = async (req, res, next) => {
  try {
    const implementation = await Implementation.findById(req.params.id);
    if (!implementation) return next(new AppError('Implementation record not found', 404));

    // Check RBAC: owner or admin. Roles are an array (user.roles), not user.role.
    const isAdmin = (req.user.roles || []).includes(ROLES.ADMIN);
    if (!isAdmin && implementation.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the assigned implementation owner or Admin can update progress.', 403));
    }

    const { progressPercent, milestones } = req.body;

    if (progressPercent !== undefined) {
      implementation.progressPercent = progressPercent;
    }

    if (milestones) {
      implementation.milestones = milestones;
    }

    await implementation.save();

    // Advance the idea through the real implementation status chain via workflowService.
    const idea = await Idea.findById(implementation.ideaId);
    if (idea) {
      // Starting work: INITIATED → IN_PROGRESS on first progress > 0.
      if (
        implementation.progressPercent > 0 &&
        implementation.progressPercent < 100 &&
        idea.status === IDEA_STATUS.IMPLEMENTATION_INITIATED
      ) {
        await workflowService.transition({
          idea,
          toStatus: IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS,
          actor: req.user,
          comment: 'Implementation work started.',
          ipAddress: req.ip,
        });
      }

      // Completion at 100%: ensure IN_PROGRESS first, then → COMPLETED.
      if (implementation.progressPercent === 100) {
        if (idea.status === IDEA_STATUS.IMPLEMENTATION_INITIATED) {
          await workflowService.transition({
            idea,
            toStatus: IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS,
            actor: req.user,
            comment: 'Implementation work started.',
            ipAddress: req.ip,
          });
        }
        if (idea.status === IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS) {
          await workflowService.transition({
            idea,
            toStatus: IDEA_STATUS.IMPLEMENTATION_COMPLETED,
            actor: req.user,
            comment: 'Implementation reached 100% completion.',
            ipAddress: req.ip,
          });

          // Notify submitter + committee that implementation is complete.
          const User = require('../models/User');
          const [submitter, committeeMembers] = await Promise.all([
            User.findById(idea.submittedBy).lean(),
            User.find({ roles: ROLES.INNOVATION_COMMITTEE, isActive: true }).lean(),
          ]);
          if (submitter) {
            notificationService.trigger(NOTIFICATION_EVENT.IMPLEMENTATION_COMPLETED, {
              idea,
              submitter,
              committeeMembers: committeeMembers || [],
            });
          }
        }
      }
    }

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'Implementation',
      entityId: implementation._id.toString(),
      metadata: { progressPercent: implementation.progressPercent }
    });

    res.status(200).json({ success: true, data: implementation });
  } catch (err) {
    next(err);
  }
};
