/**
 * server/controllers/dashboardController.js
 * Home dashboard KPIs and supporting data — FR-01 complete.
 *
 * 9 KPIs (FR-01-01):
 *   1. Ideathons Hosted (FY)
 *   2. Associates Who Shared Ideas (FY)
 *   3. Ideas Received (FY)
 *   4. Opportunities Tagged (ideas in active stages)
 *   5. Implemented Ideas
 *   6. Benefits Realized (total INR)
 *   7. Active Participants (users who have submitted at least 1 idea, FY)
 *   8. Department Participation Rate (%)
 *   9. Innovation Index (composite — approved rate × implementation rate × benefit realization)
 *
 * Cache: simple in-memory LRU with 5-min TTL (refreshes on any write via cache invalidation).
 * No Redis required in Phase 1. Can be swapped to Redis later without API changes.
 *
 * FRD FR-01, Master Prompt §6 (FR-01)
 */
const Idea = require('../models/Idea');
const User = require('../models/User');
const IdeathonEvent = require('../models/IdeathonEvent');
const Benefit = require('../models/Benefit');
const Announcement = require('../models/Announcement');
const DepartmentTarget = require('../models/DepartmentTarget');
const {
  IDEA_STATUS,
  EVENT_STATUS,
  getFYDateRange,
  getFYLabel,
  ROLES,
} = require('../../shared/constants');

// ---------------------------------------------------------------------------
// Simple in-memory cache (5-min TTL) — FR-01-01 "refreshes within 5 minutes"
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

/** Invalidate dashboard cache (called after any write that affects KPIs) */
const invalidateCache = () => cache.clear();

// ---------------------------------------------------------------------------
// KPI computation
// ---------------------------------------------------------------------------
const computeKPIs = async ({ fyLabel, department, linkedEventId }) => {
  const { start: fyStart, end: fyEnd } = getFYDateRange(fyLabel);

  // Base date filter for FY
  const fyFilter = { createdAt: { $gte: fyStart, $lte: fyEnd } };

  // Optional dept filter
  const deptFilter = department ? { department } : {};
  const eventFilter = linkedEventId ? { linkedEventId } : {};

  const ideaBaseFilter = {
    ...fyFilter,
    ...deptFilter,
    ...eventFilter,
    status: { $nin: [IDEA_STATUS.DRAFT] }, // exclude drafts from all counts
  };

  const [
    ideathonsHosted,
    ideasReceived,
    uniqueSubmitters,
    implementedIdeas,
    benefitDocs,
    totalUsers,
  ] = await Promise.all([
    // 1. Ideathons Hosted in FY
    IdeathonEvent.countDocuments({
      createdAt: { $gte: fyStart, $lte: fyEnd },
      status: { $ne: EVENT_STATUS.DRAFT },
      ...(department ? { targetDepartments: department } : {}),
    }),

    // 3. Ideas Received (FY)
    Idea.countDocuments(ideaBaseFilter),

    // 2. Associates Who Shared Ideas (FY) — unique submitters
    Idea.distinct('submittedBy', ideaBaseFilter),

    // 5. Implemented Ideas (FY)
    Idea.countDocuments({
      ...ideaBaseFilter,
      status: {
        $in: [
          IDEA_STATUS.IMPLEMENTATION_COMPLETED,
          IDEA_STATUS.BENEFITS_RECORDED,
          IDEA_STATUS.OUTCOME_MONITORED,
          IDEA_STATUS.CLOSED,
        ],
      },
    }),

    // 6. Benefits Realized — sum of costSavingsINR + revenueIncreaseINR
    Benefit.aggregate([
      {
        $lookup: {
          from: 'ideas',
          localField: 'ideaId',
          foreignField: '_id',
          as: 'idea',
        },
      },
      { $unwind: '$idea' },
      {
        $match: {
          'idea.createdAt': { $gte: fyStart, $lte: fyEnd },
          ...(department ? { 'idea.department': department } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalCostSavings: { $sum: '$financial.costSavingsINR' },
          totalRevenueIncrease: { $sum: '$financial.revenueIncreaseINR' },
        },
      },
    ]),

    // For Department Participation Rate denominator
    User.countDocuments({ isActive: true, ...(department ? { department } : {}) }),
  ]);

  // Derived metrics
  const associatesShared = uniqueSubmitters.length;
  const benefitsINR =
    (benefitDocs[0]?.totalCostSavings || 0) + (benefitDocs[0]?.totalRevenueIncrease || 0);

  // 4. Opportunities Tagged (ideas currently in active pipeline stages)
  const opportunitiesTagged = await Idea.countDocuments({
    ...ideaBaseFilter,
    status: {
      $in: [
        IDEA_STATUS.UNDER_SUPERVISOR_REVIEW,
        IDEA_STATUS.SUPERVISOR_APPROVED,
        IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION,
        IDEA_STATUS.SHORTLISTED,
        IDEA_STATUS.UNDER_COMMITTEE_REVIEW,
        IDEA_STATUS.APPROVED_FOR_PUBLISHING,
        IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      ],
    },
  });

  // 7. Active Participants (users who submitted in FY)
  const activeParticipants = associatesShared;

  // 8. Department Participation Rate
  const deptParticipationRate =
    totalUsers > 0 ? Math.round((associatesShared / totalUsers) * 100) : 0;

  // 9. Innovation Index (composite)
  const approvedIdeas = await Idea.countDocuments({
    ...ideaBaseFilter,
    status: {
      $in: [
        IDEA_STATUS.APPROVED_FOR_PUBLISHING,
        IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
        IDEA_STATUS.PUBLISHED,
        IDEA_STATUS.IMPLEMENTATION_INITIATED,
        IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS,
        IDEA_STATUS.IMPLEMENTATION_COMPLETED,
        IDEA_STATUS.BENEFITS_RECORDED,
        IDEA_STATUS.OUTCOME_MONITORED,
        IDEA_STATUS.CLOSED,
      ],
    },
  });

  const approvalRate = ideasReceived > 0 ? approvedIdeas / ideasReceived : 0;
  const implementationRate = approvedIdeas > 0 ? implementedIdeas / approvedIdeas : 0;
  const benefitRate = implementedIdeas > 0 && benefitsINR > 0 ? Math.min(1, benefitsINR / (implementedIdeas * 100000)) : 0;
  const innovationIndex = Math.round(
    ((approvalRate * 0.4 + implementationRate * 0.4 + benefitRate * 0.2) * 100) * 10
  ) / 10;

  return {
    financialYear: fyLabel,
    ideathonsHosted,
    associatesSharedIdeas: associatesShared,
    ideasReceived,
    opportunitiesTagged,
    implementedIdeas,
    benefitsRealizedINR: benefitsINR,
    activeParticipants,
    departmentParticipationRate: deptParticipationRate,
    innovationIndex,
  };
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/kpis
// ---------------------------------------------------------------------------
exports.getKPIs = async (req, res, next) => {
  try {
    const fyLabel = req.query.fy || getFYLabel();
    const department = req.query.department || '';
    const linkedEventId = req.query.event || '';

    const cacheKey = `kpis:${fyLabel}:${department}:${linkedEventId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, cached: true });
    }

    const kpis = await computeKPIs({ fyLabel, department, linkedEventId });
    setCache(cacheKey, kpis);

    res.status(200).json({ success: true, data: kpis });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/featured-ideas
// FR-01-02: min 3 featured ideas; admin-configurable (isFeatured flag)
// ---------------------------------------------------------------------------
exports.getFeaturedIdeas = async (req, res, next) => {
  try {
    const featured = await Idea.find({
      status: IDEA_STATUS.PUBLISHED,
      isFeatured: true,
    })
      .sort({ publishedAt: -1 })
      .limit(10)
      .populate('submittedBy', 'name department')
      .lean();

    // Fallback to most recent published ideas if fewer than 3 are featured
    let ideas = featured;
    if (ideas.length < 3) {
      const recent = await Idea.find({
        status: IDEA_STATUS.PUBLISHED,
        _id: { $nin: ideas.map((i) => i._id) },
      })
        .sort({ publishedAt: -1 })
        .limit(3 - ideas.length)
        .populate('submittedBy', 'name department')
        .lean();
      ideas = [...ideas, ...recent];
    }

    res.status(200).json({ success: true, data: ideas });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/success-stories
// FR-01-03: implemented ideas with benefit data
// ---------------------------------------------------------------------------
exports.getSuccessStories = async (req, res, next) => {
  try {
    const stories = await Idea.find({
      status: {
        $in: [
          IDEA_STATUS.BENEFITS_RECORDED,
          IDEA_STATUS.OUTCOME_MONITORED,
          IDEA_STATUS.CLOSED,
        ],
      },
    })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate('submittedBy', 'name department')
      .lean();

    // Attach benefit data
    const Benefit = require('../models/Benefit');
    const storyIds = stories.map((s) => s._id);
    const benefits = await Benefit.find({ ideaId: { $in: storyIds } }).lean();
    const benefitMap = benefits.reduce((acc, b) => {
      acc[b.ideaId.toString()] = b;
      return acc;
    }, {});

    const storiesWithBenefits = stories.map((s) => ({
      ...s,
      benefit: benefitMap[s._id.toString()] || null,
    }));

    res.status(200).json({ success: true, data: storiesWithBenefits });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/announcements
// FR-01-04: active, non-expired announcements
// ---------------------------------------------------------------------------
exports.getAnnouncements = async (req, res, next) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      expiryDate: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'name')
      .lean();

    res.status(200).json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/department-targets
// FR-01-06, §9: target achievement per department
// ---------------------------------------------------------------------------
exports.getDepartmentTargets = async (req, res, next) => {
  try {
    const fyLabel = req.query.fy || getFYLabel();
    const { start: fyStart, end: fyEnd } = getFYDateRange(fyLabel);

    const targets = await DepartmentTarget.find({ financialYear: fyLabel }).lean();

    const results = await Promise.all(
      targets.map(async (target) => {
        let actual = 0;
        const baseFilter = {
          department: target.department,
          createdAt: { $gte: fyStart, $lte: fyEnd },
          status: { $ne: IDEA_STATUS.DRAFT },
        };

        if (target.targetType === 'total_ideas') {
          actual = await Idea.countDocuments(baseFilter);
        } else if (target.targetType === 'approved_ideas') {
          actual = await Idea.countDocuments({
            ...baseFilter,
            status: {
              $in: [
                IDEA_STATUS.APPROVED_FOR_PUBLISHING,
                IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
                IDEA_STATUS.PUBLISHED,
                IDEA_STATUS.IMPLEMENTATION_INITIATED,
                IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS,
                IDEA_STATUS.IMPLEMENTATION_COMPLETED,
                IDEA_STATUS.BENEFITS_RECORDED,
                IDEA_STATUS.OUTCOME_MONITORED,
                IDEA_STATUS.CLOSED,
              ],
            },
          });
        } else if (target.targetType === 'implemented_ideas') {
          actual = await Idea.countDocuments({
            ...baseFilter,
            status: {
              $in: [
                IDEA_STATUS.IMPLEMENTATION_COMPLETED,
                IDEA_STATUS.BENEFITS_RECORDED,
                IDEA_STATUS.OUTCOME_MONITORED,
                IDEA_STATUS.CLOSED,
              ],
            },
          });
        }

        const achievementPct = target.targetValue > 0
          ? Math.round((actual / target.targetValue) * 100)
          : 0;

        return {
          department: target.department,
          targetType: target.targetType,
          targetValue: target.targetValue,
          actual,
          achievementPct,
          status: achievementPct >= 100 ? 'Achieved' : achievementPct >= 66 ? 'On Track' : 'At Risk',
        };
      })
    );

    res.status(200).json({ success: true, data: results, financialYear: fyLabel });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  ...exports,
  invalidateCache,
};
