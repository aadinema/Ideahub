/**
 * server/controllers/committeeController.js
 * Innovation Committee Review Workflow (FR-05)
 */
const Idea = require('../models/Idea');
const Evaluation = require('../models/Evaluation');
const Benefit = require('../models/Benefit');
const User = require('../models/User');
const Implementation = require('../models/Implementation');
const workflowService = require('../services/workflowService');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const { IDEA_STATUS, ROLES, NOTIFICATION_EVENT } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// GET /api/committee/ideas/:id/360-view
// 360-degree view combining idea, evaluations, benefits, history
// ---------------------------------------------------------------------------
exports.get360View = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('submittedBy', 'name department employeeId designation')
      .populate('supervisorId', 'name')
      .populate('linkedEventId', 'eventName')
      .populate('statusHistory.actor', 'name roles')
      .lean();

    if (!idea) return next(new AppError('Idea not found', 404));

    const evaluations = await Evaluation.find({ ideaId: idea._id })
      .populate('evaluatorId', 'name designation department')
      .lean();

    const benefits = await Benefit.find({ ideaId: idea._id }).lean();

    res.status(200).json({
      success: true,
      data: {
        idea,
        evaluations,
        benefits,
        averageScore: evaluations.length > 0
          ? Number(
              (
                evaluations.reduce((sum, ev) => sum + (ev.weightedTotal || 0), 0) /
                evaluations.length
              ).toFixed(2)
            )
          : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/committee/implementation-owners
// Directory of users eligible to own an implementation, for the assignment
// picker on the 360 view. Scoped to active users holding the role.
// ---------------------------------------------------------------------------
exports.getImplementationOwners = async (req, res, next) => {
  try {
    const owners = await User.find({
      roles: ROLES.IMPLEMENTATION_OWNER,
      isActive: true,
    })
      .select('name email department designation')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({ success: true, data: owners });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/committee/ideas/:id/approve-publishing
// Transition to APPROVED_FOR_PUBLISHING
// ---------------------------------------------------------------------------
exports.approvePublishing = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    const { comment } = req.body;
    
    // Optional: allow committee to mark as featured at approval time.
    if (req.body.isFeatured === true) idea.isFeatured = true;

    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.APPROVED_FOR_PUBLISHING,
      actor: req.user,
      comment,
      ipAddress: req.ip
    });

    if (idea.isFeatured) await idea.save();

    // Notify submitter (+ their dept head) of committee approval.
    const submitter = await User.findById(idea.submittedBy).lean();
    let deptHead = null;
    if (submitter) {
      deptHead = await User.findOne({
        department: submitter.department,
        roles: ROLES.SUPERVISOR,
        isActive: true,
      }).lean();
      notificationService.trigger(NOTIFICATION_EVENT.APPROVED_BY_COMMITTEE, {
        idea,
        submitter,
        deptHead,
      });
    }

    res.status(200).json({ success: true, message: 'Idea approved for publishing.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/committee/ideas/:id/approve-implementation
// Transition to APPROVED_FOR_IMPLEMENTATION (requires implementationOwnerId)
// ---------------------------------------------------------------------------
exports.approveImplementation = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    const { comment, implementationOwnerId } = req.body;
    
    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      actor: req.user,
      comment,
      extra: { implementationOwnerId }, // Workflow service validator will check this
      ipAddress: req.ip
    });

    const submitter = await User.findById(idea.submittedBy).lean();
    const owner = await User.findById(implementationOwnerId).lean();

    // Create the implementation record
    const existingImpl = await Implementation.findOne({ ideaId: idea._id });
    if (!existingImpl) {
      const implementation = await Implementation.create({
        ideaId: idea._id,
        ownerId: owner._id,
        department: owner.department || idea.department,
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days
        milestones: [],
      });

      // Auto-transition to IMPLEMENTATION_INITIATED since the record is now created
      await workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.IMPLEMENTATION_INITIATED,
        actor: req.user,
        comment: 'Implementation record created automatically upon committee assignment.',
        ipAddress: req.ip,
      });

      const auditService = require('../services/auditService');
      const { AUDIT_ACTION } = require('../../shared/constants');
      await auditService.log({
        actorId: req.user._id,
        action: AUDIT_ACTION.CREATE,
        entityType: 'Implementation',
        entityId: implementation._id.toString(),
        metadata: { ideaId: idea._id, ownerId: owner._id }
      });
    }

    if (submitter && owner) {
      notificationService.trigger(NOTIFICATION_EVENT.IMPLEMENTATION_ASSIGNED, { idea, owner, submitter });
    }

    res.status(200).json({ success: true, message: 'Idea approved for implementation.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/committee/ideas/:id/reject
// Transition to COMMITTEE_REJECTED (requires comment)
// ---------------------------------------------------------------------------
exports.rejectIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    const { comment } = req.body;
    
    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.COMMITTEE_REJECTED,
      actor: req.user,
      comment, // Workflow service requires >=20 chars
      ipAddress: req.ip
    });

    const submitter = await User.findById(idea.submittedBy).lean();
    if (submitter) {
      notificationService.trigger(NOTIFICATION_EVENT.IDEA_REJECTED, { idea, submitter, comment });
    }

    res.status(200).json({ success: true, message: 'Idea rejected by committee.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/committee/ideas/:id/defer
// Admin override: push back to SUBMITTED
// ---------------------------------------------------------------------------
exports.deferIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    const { comment } = req.body;
    
    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.SUBMITTED,
      actor: req.user,
      comment,
      isAdminOverride: true, // Requires admin override reason normally, or transition logic maps it if valid
      overrideReason: comment,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Idea deferred and sent back to submitted state.' });
  } catch (err) {
    next(err);
  }
};
