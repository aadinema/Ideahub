/**
 * server/controllers/evaluationController.js
 * Department Evaluation workflow (FR-04).
 */
const Idea = require('../models/Idea');
const Evaluation = require('../models/Evaluation');
const EvaluationCriteria = require('../models/EvaluationCriteria');
const workflowService = require('../services/workflowService');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { IDEA_STATUS, ALL_EVALUATION_DECISIONS, ROLES, NOTIFICATION_EVENT } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// POST /api/evaluations
// Submit a score set for an idea
// ---------------------------------------------------------------------------
exports.submitEvaluation = async (req, res, next) => {
  try {
    const { ideaId, scores, comments, decision } = req.body;

    const idea = await Idea.findById(ideaId);
    if (!idea) return next(new AppError('Idea not found', 404));

    if (idea.status !== IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION) {
      return next(new AppError('Idea is not currently in the evaluation stage.', 400));
    }

    // Enforce assigned evaluators rule (or allow admin override)
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);
    if (!isAdmin && idea.assignedEvaluators && idea.assignedEvaluators.length > 0) {
      const isAssigned = idea.assignedEvaluators.some(
        (evaluatorId) => evaluatorId.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return next(new AppError('You are not assigned to evaluate this idea.', 403));
      }
    }

    // Decision is required and must be one of the allowed values
    if (!decision || !ALL_EVALUATION_DECISIONS.includes(decision)) {
      return next(
        new AppError(
          `A valid decision is required (one of: ${ALL_EVALUATION_DECISIONS.join(', ')}).`,
          422
        )
      );
    }

    if (!comments || comments.trim().length < 10) {
      return next(new AppError('Evaluator comments (min 10 characters) are required.', 422));
    }

    if (!scores || typeof scores !== 'object') {
      return next(new AppError('Scores are required.', 422));
    }

    // Ensure the evaluator hasn't already evaluated this idea
    const existingEval = await Evaluation.findOne({ ideaId, evaluatorId: req.user._id });
    if (existingEval) {
      return next(new AppError('You have already evaluated this idea.', 400));
    }

    // Fetch the active criteria set — one document per criterion.
    // Prefer event-specific criteria when the idea is linked to an event.
    const criteriaFilter = { isActive: true };
    const activeCriteria = await EvaluationCriteria.find(
      idea.linkedEventId
        ? { $or: [{ ideathonEventId: idea.linkedEventId }, { ideathonEventId: null }], isActive: true }
        : { ideathonEventId: null, isActive: true }
    ).lean();

    // If an event-specific set exists, use only those; otherwise fall back to global.
    let criteriaSet = activeCriteria;
    if (idea.linkedEventId) {
      const eventSpecific = activeCriteria.filter(
        (c) => c.ideathonEventId && c.ideathonEventId.toString() === idea.linkedEventId.toString()
      );
      if (eventSpecific.length > 0) criteriaSet = eventSpecific;
      else criteriaSet = activeCriteria.filter((c) => !c.ideathonEventId);
    }

    if (!criteriaSet || criteriaSet.length === 0) {
      // Fallback: any active criteria at all
      criteriaSet = await EvaluationCriteria.find(criteriaFilter).lean();
    }
    if (!criteriaSet || criteriaSet.length === 0) {
      return next(new AppError('No active evaluation criteria found in the system.', 500));
    }

    const evaluationScores = [];

    // Validate each criterion's score against its own configured range (default 1-10).
    for (const criterion of criteriaSet) {
      const scoreVal = Number(scores[criterion.criterionName]);
      const min = criterion.scoreRangeMin ?? 1;
      const max = criterion.scoreRangeMax ?? 10;

      if (!Number.isFinite(scoreVal) || scoreVal < min || scoreVal > max) {
        return next(
          new AppError(
            `A valid score (${min}-${max}) is required for criterion: ${criterion.criterionName}`,
            422
          )
        );
      }

      evaluationScores.push({
        criterion: criterion.criterionName,
        criteriaId: criterion._id,
        score: scoreVal,
        weight: criterion.weight, // decimal (e.g. 0.15)
      });
    }

    // weightedTotal is computed in the model's pre-save hook (Σ score × weight).
    const evaluation = await Evaluation.create({
      ideaId,
      evaluatorId: req.user._id,
      criteriaVersion: criteriaSet[0]?.version || 1,
      scores: evaluationScores,
      comments: comments.trim(),
      decision,
    });

    res.status(201).json({ success: true, data: evaluation });
  } catch (err) {
    console.error('[submitEvaluation] Error:', err.message, err.stack);
    if (typeof next === 'function') {
      next(err);
    } else {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

// ---------------------------------------------------------------------------
// GET /api/evaluations/idea/:ideaId
// Get all evaluations for a specific idea
// ---------------------------------------------------------------------------
exports.getEvaluationsByIdea = async (req, res, next) => {
  try {
    const evaluations = await Evaluation.find({ ideaId: req.params.ideaId })
      .populate('evaluatorId', 'name designation')
      .lean();

    res.status(200).json({ success: true, data: evaluations });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/evaluations/criteria
// Get the currently active evaluation criteria for rendering the form
// ---------------------------------------------------------------------------
exports.getActiveCriteria = async (req, res, next) => {
  try {
    // Optionally scope to an event via ?eventId=
    const { eventId } = req.query;
    let criteria;
    if (eventId) {
      const eventSpecific = await EvaluationCriteria.find({
        ideathonEventId: eventId,
        isActive: true,
      })
        .sort({ criterionName: 1 })
        .lean();
      criteria =
        eventSpecific.length > 0
          ? eventSpecific
          : await EvaluationCriteria.find({ ideathonEventId: null, isActive: true })
              .sort({ criterionName: 1 })
              .lean();
    } else {
      criteria = await EvaluationCriteria.find({ ideathonEventId: null, isActive: true })
        .sort({ criterionName: 1 })
        .lean();
    }

    res.status(200).json({ success: true, data: criteria });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/evaluations/ideas/:id/shortlist
// ---------------------------------------------------------------------------
exports.shortlistIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    // Note: workflowService.shortlist enforces >= 2 evaluators rule
    await workflowService.shortlist(idea, req.user, { ipAddress: req.ip });

    // Auto-route to committee
    await workflowService.routeToCommittee(idea);

    const submitter = await User.findById(idea.submittedBy).lean();
    const committeeMembers = await User.find({ roles: ROLES.INNOVATION_COMMITTEE, isActive: true }).lean();
    if (submitter) {
      notificationService.trigger(NOTIFICATION_EVENT.SHORTLISTED_BY_DEPT, { idea, submitter, committeeMembers });
    }

    res.status(200).json({ success: true, message: 'Idea shortlisted for committee review.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/evaluations/ideas/:id/reject
// ---------------------------------------------------------------------------
exports.rejectIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return next(new AppError('Idea not found', 404));

    const { comment } = req.body;
    await workflowService.rejectByDept(idea, req.user, { comment, ipAddress: req.ip });

    res.status(200).json({ success: true, message: 'Idea rejected by department.' });
  } catch (err) {
    next(err);
  }
};
