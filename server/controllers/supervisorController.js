/**
 * server/controllers/supervisorController.js
 * Supervisor validation workflow (FR-03).
 */
const Idea = require('../models/Idea');
const User = require('../models/User');
const workflowService = require('../services/workflowService');
const notificationService = require('../services/notificationService');
const { getHolidays, getElapsedBusinessDays } = require('../utils/businessDays');
const AppError = require('../utils/AppError');
const { IDEA_STATUS, ROLES, NOTIFICATION_EVENT } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// GET /api/supervisor/queue
// Get pending ideas for the supervisor's team. Includes SLA computation.
// ---------------------------------------------------------------------------
exports.getQueue = async (req, res, next) => {
  try {
    const supervisorId = req.user._id;
    
    const ideas = await Idea.find({
      supervisorId,
      status: IDEA_STATUS.UNDER_SUPERVISOR_REVIEW
    })
      .populate('submittedBy', 'name department employeeId')
      .sort({ updatedAt: 1 })
      .lean();

    const holidays = await getHolidays();
    const now = new Date();

    const queueWithSLA = ideas.map(idea => {
      const historyEntry = [...idea.statusHistory]
        .reverse()
        .find(h => h.status === IDEA_STATUS.UNDER_SUPERVISOR_REVIEW);
      
      let elapsedBusinessDays = 0;
      if (historyEntry) {
        elapsedBusinessDays = getElapsedBusinessDays(historyEntry.timestamp, now, holidays);
      }
      
      const slaLimit = 3;
      const slaRemaining = Math.max(0, slaLimit - elapsedBusinessDays);
      const isBreached = elapsedBusinessDays > slaLimit;

      return {
        ...idea,
        sla: {
          elapsedDays: elapsedBusinessDays,
          remainingDays: slaRemaining,
          isBreached,
          status: isBreached ? 'red' : slaRemaining === 1 ? 'amber' : 'green'
        }
      };
    });

    res.status(200).json({ success: true, data: queueWithSLA });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ideas/:id/approve
// Supervisor approves the idea
// ---------------------------------------------------------------------------
exports.approveIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.supervisorId.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not the assigned supervisor for this idea.', 403));
    }

    const comment = req.body.comment || '';

    // Transition to SUPERVISOR_APPROVED
    await workflowService.supervisorApprove(idea, req.user, { comment, ipAddress: req.ip });

    // Auto-route to Dept Evaluation
    await workflowService.routeToDeptEvaluation(idea);

    // Notify submitter of approval.
    const submitter = await User.findById(idea.submittedBy).lean();
    if (submitter) {
      notificationService.trigger(NOTIFICATION_EVENT.APPROVED_BY_SUPERVISOR, { idea, submitter });
    }

    // Notify department innovation team that a new idea is ready to evaluate.
    // First try same-department evaluators, then fall back to all active evaluators
    let deptTeamMembers = await User.find({
      department: idea.department,
      roles: ROLES.DEPT_INNOVATION_TEAM,
      isActive: true,
    }).lean();

    // Fallback: if no evaluators in same department, search all departments
    if (deptTeamMembers.length === 0) {
      deptTeamMembers = await User.find({
        roles: ROLES.DEPT_INNOVATION_TEAM,
        isActive: true,
      }).lean();
    }

    // Auto-assign first 2 available dept team members
    if (deptTeamMembers.length > 0) {
      idea.assignedEvaluators = deptTeamMembers.slice(0, 2).map(m => m._id);
      await idea.save();
      
      notificationService.trigger(NOTIFICATION_EVENT.ROUTED_TO_DEPT_EVALUATION, {
        idea,
        deptTeamMembers,
      });
    }

    res.status(200).json({ success: true, message: 'Idea approved successfully.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ideas/:id/reject
// Supervisor rejects the idea (requires comment >= 20 chars)
// ---------------------------------------------------------------------------
exports.rejectIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.supervisorId.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not the assigned supervisor for this idea.', 403));
    }

    const { comment } = req.body;

    await workflowService.supervisorReject(idea, req.user, { comment, ipAddress: req.ip });

    const submitter = await User.findById(idea.submittedBy).lean();
    if (submitter) {
      notificationService.trigger(NOTIFICATION_EVENT.IDEA_REJECTED, { idea, submitter, comment });
    }

    res.status(200).json({ success: true, message: 'Idea rejected.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ideas/:id/return
// Supervisor returns the idea for clarification (requires comment >= 20 chars)
// ---------------------------------------------------------------------------
exports.returnIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.supervisorId.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not the assigned supervisor for this idea.', 403));
    }

    const { comment } = req.body;

    await workflowService.supervisorReturn(idea, req.user, { comment, ipAddress: req.ip });

    const submitter = await User.findById(idea.submittedBy).lean();
    if (submitter) {
      notificationService.trigger(NOTIFICATION_EVENT.RETURNED_FOR_CLARIFICATION, {
        idea,
        submitter,
        comment,
      });
    }

    res.status(200).json({ success: true, message: 'Idea returned to employee for clarification.' });
  } catch (err) {
    next(err);
  }
};
