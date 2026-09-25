/**
 * server/controllers/benefitController.js
 * Benefits Realization & Endorsement (Phase 5).
 * FR-08
 */
const Benefit = require('../models/Benefit');
const Implementation = require('../models/Implementation');
const Idea = require('../models/Idea');
const auditService = require('../services/auditService');
const authorizationService = require('../services/authorizationService');
const workflowService = require('../services/workflowService');
const storageService = require('../services/storageService');
const AppError = require('../utils/AppError');
const { ENDORSEMENT_STATUS, AUDIT_ACTION, ROLES, IDEA_STATUS } = require('../../shared/constants');

// Build attachments from multer req.files
const buildAttachments = (files = []) =>
  files.map((file) => {
    const { url } = storageService.getFileInfo(file);
    return {
      fileName: file.originalname,
      url,
      sizeBytes: file.size,
      uploadedAt: new Date(),
    };
  });

// ---------------------------------------------------------------------------
// POST /api/benefits
// Submit benefits realization form (Implementation Owner or Admin)
// Authorization: caller must be implementation owner or admin
// ---------------------------------------------------------------------------
exports.createBenefit = async (req, res, next) => {
  try {
    const { ideaId, implementationId, financial, operational, strategic } = req.body;
    
    // Validate idea and implementation exist
    const [idea, implementation] = await Promise.all([
      Idea.findById(ideaId),
      Implementation.findById(implementationId),
    ]);

    if (!idea) return next(new AppError('Idea not found', 404));
    if (!implementation) return next(new AppError('Implementation not found', 404));
    if (implementation.ideaId.toString() !== ideaId) {
      return next(new AppError('Implementation does not belong to this idea', 400));
    }

    // Authorization: only implementation owner or admin can create benefit
    const canAccess = await authorizationService.canAccessBenefit(
      req.user,
      null,
      idea,
      implementation,
      'create'
    );
    if (!canAccess) {
      return next(new AppError(
        'Only the implementation owner or an administrator can record benefits for this idea',
        403
      ));
    }
    
    // Parse nested JSON if sent via multipart form-data
    const fin = typeof financial === 'string' ? JSON.parse(financial) : financial || {};
    const op = typeof operational === 'string' ? JSON.parse(operational) : operational || {};
    const strat = typeof strategic === 'string' ? JSON.parse(strategic) : strategic || {};

    const attachments = buildAttachments(req.files);

    const costSavings = Number(fin.costSavingsINR || 0);
    const revenueIncrease = Number(fin.revenueIncreaseINR || 0);
    const totalFinancial = costSavings + revenueIncrease;

    // Rule: Evidence attachment mandatory if financial > ₹100,000 (₹1 Lakh) — FR-08-01
    if (totalFinancial > 100000 && attachments.length === 0 && (!fin.evidenceAttachments || fin.evidenceAttachments.length === 0)) {
      return next(new AppError('Evidence document attachment is mandatory for financial benefits over ₹1,00,000 (FR-08-01).', 422));
    }

    // Rule: Operational description min 50 chars — FR-08-02
    if (op.description && op.description.trim().length < 50) {
      return next(new AppError('Operational benefit description must be at least 50 characters (FR-08-02).', 422));
    }

    const benefit = await Benefit.create({
      ideaId,
      implementationId,
      financial: {
        costSavingsINR: costSavings,
        revenueIncreaseINR: revenueIncrease,
        evidenceAttachments: attachments.length > 0 ? attachments : fin.evidenceAttachments || [],
      },
      operational: {
        efficiencyImprovementPct: Number(op.efficiencyImprovementPct || 0),
        productivityGainPct: Number(op.productivityGainPct || 0),
        description: op.description || '',
      },
      strategic: {
        customerSatisfactionChange: strat.customerSatisfactionChange ? Number(strat.customerSatisfactionChange) : null,
        innovationImpactRating: strat.innovationImpactRating ? Number(strat.innovationImpactRating) : null,
      },
      endorsementStatus: ENDORSEMENT_STATUS.PENDING,
      recordedBy: req.user._id,
    });

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityType: 'Benefit',
      entityId: benefit._id.toString(),
      metadata: { ideaId, totalFinancial }
    });

    // Advance the idea IMPLEMENTATION_COMPLETED → BENEFITS_RECORDED (the only
    // valid edge). Guarded so re-submissions or wrong-state ideas don't error.
    const currentIdea = await Idea.findById(ideaId);
    if (currentIdea && currentIdea.status === IDEA_STATUS.IMPLEMENTATION_COMPLETED) {
      await workflowService.transition({
        idea: currentIdea,
        toStatus: IDEA_STATUS.BENEFITS_RECORDED,
        actor: req.user,
        comment: 'Benefits realization data recorded.',
        ipAddress: req.ip,
      });
    }

    res.status(201).json({ success: true, data: benefit });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/benefits/ideas/:ideaId
// Get benefit realization for an idea
// Authorization: caller must have access to the idea
// ---------------------------------------------------------------------------
exports.getBenefitByIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.ideaId);
    if (!idea) {
      return next(new AppError('Idea not found', 404));
    }

    // Authorization: caller must be able to access the idea
    const canAccess = await authorizationService.canAccessIdea(req.user, idea, 'read');
    if (!canAccess) {
      return next(new AppError('Access denied to this idea', 403));
    }

    const benefit = await Benefit.findOne({ ideaId: req.params.ideaId })
      .populate('recordedBy', 'name department')
      .populate('verifiedBy', 'name department')
      .lean();

    if (!benefit) {
      return next(new AppError('No benefit record found for this idea.', 404));
    }

    res.status(200).json({ success: true, data: benefit });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/benefits/:id/endorse
// Endorse or dispute recorded benefits (Committee or Admin)
// ---------------------------------------------------------------------------
exports.endorseBenefit = async (req, res, next) => {
  try {
    const { action, disputeReason } = req.body; // action: 'endorsed' or 'disputed'

    const benefit = await Benefit.findById(req.params.id);
    if (!benefit) return next(new AppError('Benefit record not found', 404));

    if (action === 'endorsed') {
      benefit.endorsementStatus = ENDORSEMENT_STATUS.ENDORSED;
      benefit.verifiedBy = req.user._id;
    } else if (action === 'disputed') {
      if (!disputeReason || disputeReason.trim().length < 20) {
        return next(new AppError('Dispute reason must be at least 20 characters.', 422));
      }
      benefit.endorsementStatus = ENDORSEMENT_STATUS.DISPUTED;
      benefit.disputeReason = disputeReason.trim();
      benefit.routedToFinanceAt = new Date();
    } else {
      return next(new AppError('Invalid endorsement action.', 400));
    }

    await benefit.save();

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'Benefit',
      entityId: benefit._id.toString(),
      metadata: { status: benefit.endorsementStatus }
    });

    res.status(200).json({ success: true, data: benefit });
  } catch (err) {
    next(err);
  }
};
