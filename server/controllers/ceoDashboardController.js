/**
 * server/controllers/ceoDashboardController.js
 * CEO / C-Suite executive dashboard — "Innovation Command Center" (CEO-01).
 *
 * Authorization: every route is wrapped in authorize(ROLES.CEO) at the router
 * level. Frontend gating is cosmetic only; the server is the security boundary.
 *
 * DATA INTEGRITY RULES
 * - Every metric is computed from real IdeaHub data. Nothing is fabricated.
 * - Metric definitions travel with the payload (`definitions`) so the UI can
 *   show "calculated as" tooltips (data transparency).
 * - Estimated value (Idea.estimatedValueINR, submitter estimate) is always
 *   labeled separately from realized value (Benefit records). Estimated ≠ Realized.
 * - Business days exclude weekends/holidays (utils/businessDays + HolidayCalendar).
 *
 * Cache: 5-min in-memory TTL per parameterized key (same freshness promise as
 * the home dashboard, FR-01-01). Parameterized keys keep period/department
 * results from clobbering each other.
 */
const Idea = require('../models/Idea');
const User = require('../models/User');
const Benefit = require('../models/Benefit');
const Evaluation = require('../models/Evaluation');
const Implementation = require('../models/Implementation');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const { createCache } = require('../utils/memoryCache');
const { getHolidays, getElapsedBusinessDays } = require('../utils/businessDays');
const {
  APPROVED_STATUSES,
  IMPLEMENTED_STATUSES,
  ACTIVE_STATUSES,
  REVIEW_STAGES,
  PIPELINE_STAGES,
} = require('../utils/ideaStatusGroups');
const {
  IDEA_STATUS,
  AUDIT_ACTION,
  SLA_AMBER_THRESHOLD_PCT,
} = require('../../shared/constants');

const cache = createCache(5 * 60 * 1000); // 5-min TTL, per-key invalidation-free

// ---------------------------------------------------------------------------
// Period / range configuration
// ---------------------------------------------------------------------------
const PERIODS = { '7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365, all: null };
const RANGE_CONFIG = {
  '7d':   { days: 7,   granularity: 'day' },
  '30d':  { days: 30,  granularity: 'day' },
  '90d':  { days: 90,  granularity: 'week' },
  '180d': { days: 180, granularity: 'week' },
  '365d': { days: 365, granularity: 'month' },
};

/** Start of the rolling period (midnight, local). 'all' → null (no lower bound). */
const periodStart = (period) => {
  const days = PERIODS[period] ?? PERIODS['90d'];
  if (!days) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
};

const round1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : null);

// ---------------------------------------------------------------------------
// Metric definitions (data transparency — §31). Keys mirror response fields.
// ---------------------------------------------------------------------------
const DEFINITIONS = {
  totalIdeas: 'Non-draft ideas created within the selected period.',
  activeIdeas: 'Ideas currently in a non-terminal workflow state (excludes drafts, rejections, closures).',
  approvedIdeas: 'Ideas whose current status is at or past Innovation Committee approval.',
  implementedIdeas: 'Ideas at implementation completion or beyond (completed / benefits / outcome / closed).',
  implementationRate: 'Implemented Ideas ÷ Approved Ideas × 100. Null when there are no approved ideas.',
  approvalRate: 'Approved Ideas ÷ Total Ideas × 100 (current-status basis).',
  participationRate: 'Distinct submitters in period ÷ active employees × 100.',
  ideasPerEmployee: 'Ideas in period ÷ active employees.',
  potentialValue: 'Σ Idea.estimatedValueINR over ideas in period (submitter estimates; ideas without an estimate contribute nothing).',
  approvedValue: 'Σ estimatedValueINR of approved ideas in period.',
  realizedValue: 'Σ (costSavingsINR + revenueIncreaseINR) from Benefit records linked to ideas in period. Realized ≠ Estimated.',
  avgProcessingDays:
    'Mean business days from idea creation to completion (terminal ideas) or to today for ideas still in the workflow ("so far"). Excludes weekends and holidays.',
  innovationHealth: 'Weighted composite of 5 dimensions: Generation 20%, Participation 20%, Evaluation 25%, Implementation 20%, Impact 15%. Dimensions without data are excluded and remaining weights renormalized.',
  healthGeneration: `min(100, ideas per employee ÷ ${3} × 100) — target of 3 ideas per employee per period.`,
  healthParticipation: 'Submitters ÷ active employees × 100.',
  healthEvaluation: 'Ideas currently in review within their SLA ÷ ideas currently in review × 100. Null when nothing is in review.',
  healthImplementation: 'Implemented ÷ Approved × 100. Null when nothing is approved.',
  healthImpact: 'Implemented ideas with a recorded Benefit ÷ implemented ideas × 100. Null when nothing is implemented.',
};

// Innovation Health — documented composite (§8). Weights sum to 1.0.
const HEALTH_WEIGHTS = Object.freeze({
  generation: 0.20,
  participation: 0.20,
  evaluation: 0.25,
  implementation: 0.20,
  impact: 0.15,
});
const IDEAS_PER_EMPLOYEE_TARGET = 3; // normalization target (documented in DEFINITIONS)

// Strategic-idea signal threshold: average evaluator score ≥ 7/10 counts as a
// quality signal alongside value/featured signals.
const STRONG_EVAL_SCORE = 7;

// ---------------------------------------------------------------------------
// Shared: current-status wait computation for review stages
// ---------------------------------------------------------------------------
/**
 * For every idea waiting in a SLA-bound stage, compute elapsed business days
 * in its current status.
 * @returns {Array} { idea, stage, elapsedDays, breached }
 */
const computeReviewWaits = (ideas, holidays, now) => {
  const waits = [];
  for (const idea of ideas) {
    const stage = REVIEW_STAGES.find((s) => s.waitingStatuses.includes(idea.status));
    if (!stage) continue;
    // The current status was entered at the matching (last) statusHistory entry.
    const history = Array.isArray(idea.statusHistory) ? idea.statusHistory : [];
    const entry = [...history].reverse().find((h) => h.status === idea.status);
    const since = entry?.timestamp || entry?.createdAt || idea.createdAt;
    if (!since) continue;
    const elapsedDays = getElapsedBusinessDays(since, now, holidays);
    waits.push({
      idea,
      stage,
      elapsedDays,
      slaDays: stage.slaBusinessDays,
      breached: elapsedDays > stage.slaBusinessDays,
    });
  }
  return waits;
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/ceo/overview
// Level-1 executive KPIs + Innovation Health + Business Impact + Participation
// Query: period (7d|30d|90d|180d|365d|all), department
// ---------------------------------------------------------------------------
exports.getOverview = async (req, res, next) => {
  try {
    const period = PERIODS[req.query.period] !== undefined ? req.query.period : '90d';
    const department = (req.query.department || '').trim();
    const since = periodStart(period);

    const cacheKey = `overview:${period}:${department || '*'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached, cached: true });

    const match = {
      status: { $ne: IDEA_STATUS.DRAFT },
      ...(since ? { createdAt: { $gte: since } } : {}),
      ...(department ? { department } : {}),
    };
    const benefitMatch = {
      'idea.status': { $ne: IDEA_STATUS.DRAFT },
      ...(since ? { 'idea.createdAt': { $gte: since } } : {}),
      ...(department ? { 'idea.department': department } : {}),
    };

    const holidays = await getHolidays();
    const now = new Date();

    const [
      statusCounts,
      submitterGroups,
      eligibleUsers,
      estimateAgg,
      benefitAgg,
      cohortIdeas,
      prePeriodSubmitters,
      reviewWaitIdeas,
    ] = await Promise.all([
      // Status breakdown of the cohort
      Idea.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      // Ideas per submitter in cohort (participation + repeat contributors)
      Idea.aggregate([
        { $match: match },
        { $group: { _id: '$submittedBy', ideas: { $sum: 1 } } },
      ]),
      User.countDocuments({ isActive: true, ...(department ? { department } : {}) }),
      // Estimated (potential) value — nulls are skipped by $sum
      Idea.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            potentialValue: { $sum: '$estimatedValueINR' },
            approvedValue: {
              $sum: {
                $cond: [{ $in: ['$status', [...APPROVED_STATUSES]] }, '$estimatedValueINR', 0],
              },
            },
            withEstimate: {
              $sum: { $cond: [{ $eq: ['$estimatedValueINR', null] }, 0, 1] },
            },
          },
        },
      ]),
      // Realized value from Benefit records (joined to cohort ideas)
      Benefit.aggregate([
        { $lookup: { from: 'ideas', localField: 'ideaId', foreignField: '_id', as: 'idea' } },
        { $unwind: '$idea' },
        { $match: benefitMatch },
        {
          $group: {
            _id: null,
            costSavings: { $sum: '$financial.costSavingsINR' },
            revenueIncrease: { $sum: '$financial.revenueIncreaseINR' },
            endorsedINR: {
              $sum: {
                $cond: [
                  { $eq: ['$endorsementStatus', 'endorsed'] },
                  { $add: ['$financial.costSavingsINR', '$financial.revenueIncreaseINR'] },
                  0,
                ],
              },
            },
            benefitCount: { $sum: 1 },
            benefitIdeaIds: { $addToSet: '$ideaId' },
          },
        },
      ]),
      // Cohort ideas with status trail — processing time + review waits
      Idea.find(match)
        .select('title department status createdAt statusHistory.status statusHistory.timestamp')
        .lean(),
      // Submitters active BEFORE the period (for first-time contributor insight)
      since
        ? Idea.distinct('submittedBy', {
            status: { $ne: IDEA_STATUS.DRAFT },
            createdAt: { $lt: since },
            ...(department ? { department } : {}),
          })
        : Promise.resolve([]),
      // Current review queues — evaluation efficiency is a current-state metric,
      // not a period cohort (an idea created last month still counts today).
      Idea.find({
        status: { $in: REVIEW_STAGES.flatMap((s) => s.waitingStatuses) },
        ...(department ? { department } : {}),
      })
        .select('title department status createdAt statusHistory.status statusHistory.timestamp')
        .lean(),
    ]);

    // ── Core KPIs (current-status basis) ──
    const countStatuses = (list) =>
      statusCounts.filter((s) => list.includes(s._id)).reduce((a, s) => a + s.count, 0);
    const totalIdeas = statusCounts.reduce((a, s) => a + s.count, 0);
    const activeIdeas = countStatuses([...ACTIVE_STATUSES]);
    const approvedIdeas = countStatuses([...APPROVED_STATUSES]);
    const implementedIdeas = countStatuses([...IMPLEMENTED_STATUSES]);
    const rejectedIdeas = countStatuses([
      IDEA_STATUS.SUPERVISOR_REJECTED,
      IDEA_STATUS.REJECTED_BY_DEPT,
      IDEA_STATUS.COMMITTEE_REJECTED,
    ]);

    const approvalRate = pct(approvedIdeas, totalIdeas);
    const implementationRate = pct(implementedIdeas, approvedIdeas);

    // ── Participation ──
    const submitterCount = submitterGroups.length;
    const repeatContributors = submitterGroups.filter((g) => g.ideas >= 2).length;
    const prePeriodSet = new Set((prePeriodSubmitters || []).map(String));
    const firstTimeContributors = since
      ? submitterGroups.filter((g) => !prePeriodSet.has(String(g._id))).length
      : submitterCount;
    const participationRate = pct(submitterCount, eligibleUsers);
    const ideasPerEmployee =
      eligibleUsers > 0 ? round1(totalIdeas / eligibleUsers) : null;

    // ── Business impact ──
    const est = estimateAgg[0] || {};
    const ben = benefitAgg[0] || {};
    const realizedINR = (ben.costSavings || 0) + (ben.revenueIncrease || 0);
    const realizedEndorsedINR = ben.endorsedINR || 0;
    const businessImpact = {
      potentialINR: est.potentialValue ?? null,
      approvedINR: est.approvedValue ?? null,
      realizedINR,
      realizedEndorsedINR,
      realizedPendingINR: realizedINR - realizedEndorsedINR,
      ideasWithEstimate: est.withEstimate || 0,
      ideasWithBenefit: (ben.benefitIdeaIds || []).length,
      benefitRecords: ben.benefitCount || 0,
    };

    // ── Average processing time (business days) ──
    // Terminal ideas (closed / rejected) stop the clock at their last event;
    // in-flight ideas count up to today ("so far").
    const TERMINAL_STATUSES = new Set([
      IDEA_STATUS.CLOSED,
      IDEA_STATUS.SUPERVISOR_REJECTED,
      IDEA_STATUS.REJECTED_BY_DEPT,
      IDEA_STATUS.COMMITTEE_REJECTED,
    ]);
    let processingTotal = 0;
    let processingCount = 0;
    for (const idea of cohortIdeas) {
      const history = idea.statusHistory || [];
      const last = history[history.length - 1];
      if (!idea.createdAt) continue;
      const end = TERMINAL_STATUSES.has(idea.status)
        ? last?.timestamp || idea.createdAt
        : now;
      processingTotal += getElapsedBusinessDays(idea.createdAt, end, holidays);
      processingCount += 1;
    }
    const avgProcessingDays = processingCount > 0 ? round1(processingTotal / processingCount) : null;

    // ── Innovation Health dimensions (documented in DEFINITIONS) ──
    const reviewWaits = computeReviewWaits(reviewWaitIdeas, holidays, now);
    const inReview = reviewWaits.length;
    const withinSla = reviewWaits.filter((w) => !w.breached).length;
    const implementedWithBenefit = cohortIdeas.filter(
      (i) => IMPLEMENTED_STATUSES.includes(i.status) && (ben.benefitIdeaIds || []).some((id) => String(id) === String(i._id))
    ).length;

    const dims = {
      generation:
        ideasPerEmployee === null
          ? null
          : Math.min(100, Math.round((ideasPerEmployee / IDEAS_PER_EMPLOYEE_TARGET) * 100)),
      participation: participationRate,
      evaluation: inReview > 0 ? Math.round((withinSla / inReview) * 100) : null,
      implementation: implementationRate,
      impact: implementedIdeas > 0 ? Math.round((implementedWithBenefit / implementedIdeas) * 100) : null,
    };
    let weightSum = 0;
    let scoreSum = 0;
    const dimensions = Object.entries(HEALTH_WEIGHTS).map(([key, weight]) => {
      const value = dims[key];
      if (value !== null && value !== undefined) {
        weightSum += weight;
        scoreSum += weight * value;
      }
      return { key, weight, value };
    });
    const healthScore = weightSum > 0 ? Math.round(scoreSum / weightSum) : null;

    const data = {
      period,
      department: department || null,
      generatedAt: now.toISOString(),
      kpis: {
        totalIdeas,
        activeIdeas,
        approvedIdeas,
        implementedIdeas,
        rejectedIdeas,
        approvalRate,
        implementationRate,
        participationRate,
        ideasPerEmployee,
        avgProcessingDays,
      },
      health: {
        score: healthScore,
        dimensions,
        weights: HEALTH_WEIGHTS,
      },
      businessImpact,
      participation: {
        eligibleEmployees: eligibleUsers,
        participants: submitterCount,
        participationRate,
        firstTimeContributors,
        repeatContributors,
        ideasPerEmployee,
      },
      definitions: DEFINITIONS,
    };

    cache.set(cacheKey, data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/ceo/trends
// Time-series (submitted / approved / implemented) + department performance.
// Query: range (7d|30d|90d|180d|365d), department (applies to series only)
// ---------------------------------------------------------------------------
const bucketKey = (date, granularity) => {
  const d = new Date(date);
  if (granularity === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (granularity === 'week') {
    const day = d.getDay();
    const diff = (day + 6) % 7; // Monday-start weeks
    d.setDate(d.getDate() - diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const nextBucket = (key, granularity) => {
  const d = new Date(`${key}T00:00:00`);
  if (granularity === 'day') d.setDate(d.getDate() + 1);
  else if (granularity === 'week') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return bucketKey(d, granularity);
};

exports.getTrends = async (req, res, next) => {
  try {
    const q = req.query.range;
    const range = q === 'all' || RANGE_CONFIG[q] ? q : '90d';
    const { days, granularity } =
      range === 'all' ? { days: null, granularity: 'month' } : RANGE_CONFIG[range];
    const department = (req.query.department || '').trim();

    const cacheKey = `trends:${range}:${department || '*'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached, cached: true });

    const now = new Date();
    // 'all' buckets from the earliest idea (fallback: one year back)
    let start;
    if (range === 'all') {
      const earliest = await Idea.findOne({ status: { $ne: IDEA_STATUS.DRAFT } })
        .sort({ createdAt: 1 })
        .select('createdAt')
        .lean();
      start = earliest?.createdAt || new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      start = new Date(start);
      start.setHours(0, 0, 0, 0);
    } else {
      start = periodStart(range);
    }

    const match = {
      status: { $ne: IDEA_STATUS.DRAFT },
      createdAt: { $gte: start },
      ...(department ? { department } : {}),
    };

    const [ideas, usersByDept, benefitByDept] = await Promise.all([
      Idea.find(match)
        .select('title department status createdAt submittedBy estimatedValueINR statusHistory.status statusHistory.timestamp')
        .lean(),
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$department', employees: { $sum: 1 } } },
      ]),
      // Realized value per department (ideas created within range)
      Benefit.aggregate([
        { $lookup: { from: 'ideas', localField: 'ideaId', foreignField: '_id', as: 'idea' } },
        { $unwind: '$idea' },
        { $match: {
            'idea.createdAt': { $gte: start },
            'idea.status': { $ne: IDEA_STATUS.DRAFT },
            ...(department ? { 'idea.department': department } : {}),
          },
        },
        { $group: {
            _id: '$idea.department',
            realizedINR: { $sum: { $add: ['$financial.costSavingsINR', '$financial.revenueIncreaseINR'] } },
          },
        },
      ]),
    ]);

    // ── Event extraction (first occurrence in statusHistory) ──
    const firstStatusAt = (history, statuses) => {
      for (const h of history || []) {
        if (statuses.includes(h.status) && h.timestamp) return new Date(h.timestamp);
      }
      return null;
    };
    const submittedEvent = (idea) =>
      firstStatusAt(idea.statusHistory, [IDEA_STATUS.SUBMITTED]) || new Date(idea.createdAt);
    const approvedEvent = (idea) => firstStatusAt(idea.statusHistory, [...APPROVED_STATUSES]);
    const implementedEvent = (idea) => firstStatusAt(idea.statusHistory, [...IMPLEMENTED_STATUSES]);

    // ── Zero-filled buckets across the range ──
    const seriesMap = new Map();
    let cursor = bucketKey(start, granularity);
    const endKey = bucketKey(now, granularity);
    while (cursor <= endKey) {
      seriesMap.set(cursor, { bucket: cursor, submitted: 0, approved: 0, implemented: 0 });
      cursor = nextBucket(cursor, granularity);
    }
    const addEvent = (date, field) => {
      if (!date || date < start || date > now) return;
      const key = bucketKey(date, granularity);
      const bucket = seriesMap.get(key);
      if (bucket) bucket[field] += 1;
    };
    for (const idea of ideas) {
      addEvent(submittedEvent(idea), 'submitted');
      addEvent(approvedEvent(idea), 'approved');
      addEvent(implementedEvent(idea), 'implemented');
    }

    // ── Department performance (same range; all departments shown for context) ──
    const deptIdeas = await Idea.aggregate([
      { $match: { status: { $ne: IDEA_STATUS.DRAFT }, createdAt: { $gte: start } } },
      {
        $group: {
          _id: '$department',
          ideas: { $sum: 1 },
          participants: { $addToSet: '$submittedBy' },
          approved: { $sum: { $cond: [{ $in: ['$status', [...APPROVED_STATUSES]] }, 1, 0] } },
          implemented: { $sum: { $cond: [{ $in: ['$status', [...IMPLEMENTED_STATUSES]] }, 1, 0] } },
          potentialINR: { $sum: '$estimatedValueINR' },
        },
      },
      { $sort: { ideas: -1 } },
    ]);
    const employeesByDept = new Map(usersByDept.map((u) => [u._id, u.employees]));
    const realizedByDept = new Map(benefitByDept.map((b) => [b._id, b.realizedINR]));

    const departments = deptIdeas.map((d) => ({
      department: d._id,
      ideas: d.ideas,
      participants: d.participants.length,
      employees: employeesByDept.get(d._id) || 0,
      participationRate: pct(d.participants.length, employeesByDept.get(d._id) || 0),
      approved: d.approved,
      implemented: d.implemented,
      approvalRate: pct(d.approved, d.ideas),
      implementationRate: pct(d.implemented, d.approved),
      potentialINR: d.potentialINR ?? null,
      realizedINR: realizedByDept.get(d._id) || 0,
      selected: department ? d._id === department : false,
    }));

    const data = {
      range,
      granularity,
      from: start.toISOString(),
      to: now.toISOString(),
      series: [...seriesMap.values()],
      departments,
      generatedAt: now.toISOString(),
      definitions: {
        series:
          'Counts ideas by the date each milestone first occurred in their workflow history (submitted / first approved state / first implemented state) within the range.',
        departments:
          'Department metrics count ideas created in the range (current-status basis for approved/implemented). Participation rate = distinct submitters ÷ active employees in that department. Departments are compared, not ranked.',
      },
    };

    cache.set(cacheKey, data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/ceo/pipeline
// Workflow funnel: stage counts, conversion, dwell time, bottlenecks.
// Current-state view (not period-filtered — bottlenecks are "right now").
// ---------------------------------------------------------------------------
exports.getPipeline = async (req, res, next) => {
  try {
    const cacheKey = 'pipeline';
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached, cached: true });

    const holidays = await getHolidays();
    const now = new Date();

    const ideas = await Idea.find({ status: { $ne: IDEA_STATUS.DRAFT } })
      .select('ideaId title department status createdAt statusHistory.status statusHistory.timestamp')
      .lean();

    const historyOf = (idea) =>
      [...(idea.statusHistory || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Stage ordinal for a CURRENT status. Seeded/imported ideas can have
    // partial statusHistory, so current status must also imply progression:
    // an idea at benefits_recorded necessarily passed every earlier stage.
    const currentStageIndex = (status) => {
      const byCurrent = PIPELINE_STAGES.findIndex((s) => s.current.includes(status));
      if (byCurrent >= 0) return byCurrent;
      // Terminal rejections stop at the stage that rejected them
      if (status === IDEA_STATUS.SUPERVISOR_REJECTED) return 1;
      if (status === IDEA_STATUS.REJECTED_BY_DEPT) return 2;
      if (status === IDEA_STATUS.COMMITTEE_REJECTED) return 3;
      return -1;
    };

    // ── Stage funnel ──
    const maxStageIndex = ideas.map((idea) => {
      const history = historyOf(idea);
      let idx = currentStageIndex(idea.status);
      PIPELINE_STAGES.forEach((stage, i) => {
        if (history.some((h) => stage.funnelStatuses.includes(h.status))) idx = Math.max(idx, i);
      });
      return idx;
    });
    const reachedCounts = PIPELINE_STAGES.map((_, idx) =>
      maxStageIndex.filter((maxIdx) => maxIdx >= idx).length
    );

    const stages = PIPELINE_STAGES.map((stage, idx) => {
      const waiting = ideas.filter((idea) => stage.current.includes(idea.status));

      // Dwell: time between entering a funnel status and the next workflow event
      const dwells = [];
      let recentMovements = 0;
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      for (const idea of ideas) {
        const history = historyOf(idea);
        for (let i = 0; i < history.length; i++) {
          if (!stage.funnelStatuses.includes(history[i].status)) continue;
          if (new Date(history[i].timestamp) >= weekAgo) recentMovements += 1;
          const next = history[i + 1];
          if (next?.timestamp) {
            dwells.push(getElapsedBusinessDays(history[i].timestamp, next.timestamp, holidays));
          }
        }
      }
      const avgDwellDays =
        dwells.length > 0 ? round1(dwells.reduce((a, b) => a + b, 0) / dwells.length) : null;

      // Waiting-line stats (elapsed business days in current status)
      const waits = waiting
        .map((idea) => {
          const history = historyOf(idea);
          const entry = [...history].reverse().find((h) => h.status === idea.status);
          const since = entry?.timestamp || idea.createdAt;
          return {
            idea,
            days: since ? getElapsedBusinessDays(since, now, holidays) : 0,
          };
        })
        .sort((a, b) => b.days - a.days);

      const oldest = waits[0];
      return {
        key: stage.key,
        label: stage.label,
        // Statuses that count as "waiting here" — client uses these for
        // drill-down filters (single source: utils/ideaStatusGroups.js).
        current: stage.current,
        everReached: reachedCounts[idx],
        conversionPct: idx > 0 && reachedCounts[idx - 1] > 0
          ? Math.round((reachedCounts[idx] / reachedCounts[idx - 1]) * 100)
          : null,
        waitingNow: waiting.length,
        avgWaitDays: waits.length > 0 ? round1(waits.reduce((a, w) => a + w.days, 0) / waits.length) : null,
        oldestWaiting: oldest
          ? {
              ideaId: oldest.idea._id,
              title: oldest.idea.title,
              department: oldest.idea.department,
              days: oldest.days,
            }
          : null,
        avgDwellDays,
        recentMovements7d: recentMovements,
      };
    });

    // ── Bottleneck detection (SLA-based, FRD §5.1 / FR-03-04) ──
    const waits = computeReviewWaits(ideas, holidays, now);
    const bottlenecks = REVIEW_STAGES.map((stage) => {
      const stageWaits = waits.filter((w) => w.stage.key === stage.key);
      const waitingCount = stageWaits.length;
      const avgWaitDays = waitingCount > 0
        ? round1(stageWaits.reduce((a, w) => a + w.elapsedDays, 0) / waitingCount)
        : 0;
      const breached = stageWaits.filter((w) => w.breached);
      const oldest = [...stageWaits].sort((a, b) => b.elapsedDays - a.elapsedDays)[0];
      const amberPct = (avgWaitDays / stage.slaBusinessDays) * 100;
      return {
        key: stage.key,
        label: stage.label,
        waitingStatuses: stage.waitingStatuses, // drill-down filter source
        waitingCount,
        avgWaitDays,
        slaDays: stage.slaBusinessDays,
        breachedCount: breached.length,
        // Pressure = queue size × SLA utilisation — prioritises large, slow queues
        pressure: round1(waitingCount * (avgWaitDays / stage.slaBusinessDays)),
        isBottleneck:
          breached.length > 0 || (waitingCount > 0 && amberPct >= SLA_AMBER_THRESHOLD_PCT),
        oldest: oldest
          ? {
              ideaId: oldest.idea._id,
              title: oldest.idea.title,
              department: oldest.idea.department,
              days: oldest.elapsedDays,
            }
          : null,
      };
    })
      .filter((b) => b.waitingCount > 0)
      .sort((a, b) => b.pressure - a.pressure);

    const data = {
      generatedAt: now.toISOString(),
      stages,
      bottlenecks,
      counters: {
        inPipeline: ideas.length,
        returnedToEmployee: ideas.filter((i) => i.status === IDEA_STATUS.RETURNED).length,
        rejectedTerminal: ideas.filter((i) =>
          [IDEA_STATUS.SUPERVISOR_REJECTED, IDEA_STATUS.REJECTED_BY_DEPT, IDEA_STATUS.COMMITTEE_REJECTED]
            .includes(i.status)
        ).length,
      },
      definitions: {
        everReached: 'Ideas that have ever entered this stage (from workflow history) — used for conversion rates.',
        conversionPct: 'Ideas that ever reached this stage ÷ ideas that ever reached the previous stage × 100.',
        avgWaitDays: 'Mean business days ideas have been waiting in their current status.',
        avgDwellDays: 'Mean business days spent in this stage before the next workflow event.',
        pressure: 'waitingCount × (avgWaitDays ÷ SLA limit). Higher = more urgent queue.',
        bottleneck: `Flagged when at least one idea has breached its SLA, or average wait reaches ${SLA_AMBER_THRESHOLD_PCT}% of the SLA limit.`,
      },
    };

    cache.set(cacheKey, data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/ceo/insights
// Executive attention items + strategic ideas + recent strategic activity.
// ---------------------------------------------------------------------------
exports.getInsights = async (req, res, next) => {
  try {
    const cacheKey = 'insights';
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached, cached: true });

    const holidays = await getHolidays();
    const now = new Date();

    const [
      ideas,
      implementations,
      evalAgg,
      benefitAgg,
      logs,
    ] = await Promise.all([
      Idea.find({ status: { $ne: IDEA_STATUS.DRAFT } })
        .select(
          'ideaId title department status createdAt estimatedValueINR isFeatured updatedAt submittedBy statusHistory.status statusHistory.timestamp'
        )
        .populate('submittedBy', 'name')
        .lean(),
      Implementation.find({ progressPercent: { $lt: 100 } })
        .populate('ideaId', 'title ideaId department status')
        .populate('ownerId', 'name')
        .lean(),
      // Average evaluator score per idea (weightedTotal is already on a 1–10 scale)
      Evaluation.aggregate([
        { $group: { _id: '$ideaId', avgScore: { $avg: '$weightedTotal' }, evaluators: { $sum: 1 } } },
      ]),
      // Realized value per idea
      Benefit.aggregate([
        { $group: {
            _id: '$ideaId',
            realizedINR: { $sum: { $add: ['$financial.costSavingsINR', '$financial.revenueIncreaseINR'] } },
            endorsed: { $max: { $eq: ['$endorsementStatus', 'endorsed'] } },
          },
        },
      ]),
      AuditLog.find({
        entityType: 'Idea',
        action: {
          $in: [
            AUDIT_ACTION.STATUS_CHANGE,
            AUDIT_ACTION.APPROVE,
            AUDIT_ACTION.REJECT,
            AUDIT_ACTION.PUBLISH,
            AUDIT_ACTION.CREATE,
            AUDIT_ACTION.ADMIN_OVERRIDE,
          ],
        },
      })
        .sort({ timestamp: -1 })
        .limit(8)
        .populate('actorId', 'name')
        .lean(),
    ]);

    // ── 1. Executive attention (real, rule-based — no fabricated urgency) ──
    const attention = [];

    // a) SLA breaches in review stages
    const reviewWaits = computeReviewWaits(ideas, holidays, now);
    for (const w of reviewWaits.filter((x) => x.breached)) {
      attention.push({
        type: 'sla_breach',
        severity: w.elapsedDays > w.slaDays * 2 ? 'high' : 'medium',
        title: `${w.stage.label} SLA breached`,
        whyItMatters: `Waiting ${w.elapsedDays} business days against a ${w.slaDays}-day SLA`,
        ideaId: w.idea._id,
        ideaTitle: w.idea.title,
        department: w.idea.department,
        stage: w.stage.label,
        ageDays: w.elapsedDays,
      });
    }

    // b) Overdue implementations (target date passed, progress < 100)
    for (const impl of implementations) {
      if (!impl.targetCompletionDate || new Date(impl.targetCompletionDate) >= now) continue;
      const overdueDays = getElapsedBusinessDays(impl.targetCompletionDate, now, holidays);
      const overdueMilestones = (impl.milestones || []).filter(
        (m) => m.status !== 'completed' && m.targetDate && new Date(m.targetDate) < now
      ).length;
      attention.push({
        type: 'implementation_overdue',
        severity: overdueDays > 15 ? 'high' : 'medium',
        title: 'Implementation overdue',
        whyItMatters: `Target date passed by ${overdueDays} business days · ${impl.progressPercent}% complete${
          overdueMilestones > 0 ? ` · ${overdueMilestones} milestone(s) overdue` : ''
        }`,
        ideaId: impl.ideaId?._id,
        ideaTitle: impl.ideaId?.title || 'Implementation',
        department: impl.department,
        stage: 'Implementation',
        owner: impl.ownerId?.name || null,
        ageDays: overdueDays,
      });
    }

    // c) Approved for implementation but no implementation started
    const implIdeaIds = new Set(implementations.map((i) => String(i.ideaId?._id || i.ideaId)));
    for (const idea of ideas.filter((i) => i.status === IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION)) {
      if (implIdeaIds.has(String(idea._id))) continue;
      const history = [...(idea.statusHistory || [])].reverse();
      const entry = history.find((h) => h.status === idea.status);
      const since = entry?.timestamp || idea.createdAt;
      attention.push({
        type: 'awaiting_implementation',
        severity: 'medium',
        title: 'Approved — implementation not started',
        whyItMatters: `Committee approved this idea; no implementation record exists yet (${getElapsedBusinessDays(
          since,
          now,
          holidays
        )} business days)`,
        ideaId: idea._id,
        ideaTitle: idea.title,
        department: idea.department,
        stage: 'Approved for implementation',
        ageDays: getElapsedBusinessDays(since, now, holidays),
      });
    }

    attention.sort((a, b) => {
      const rank = { high: 0, medium: 1 };
      return rank[a.severity] - rank[b.severity] || b.ageDays - a.ageDays;
    });

    // ── 2. Strategic / high-impact ideas ──
    const evalByIdea = new Map(evalAgg.map((e) => [String(e._id), e]));
    const benefitByIdea = new Map(benefitAgg.map((b) => [String(b._id), b]));

    const strategic = ideas
      .map((idea) => {
        const evalEntry = evalByIdea.get(String(idea._id));
        const benefitEntry = benefitByIdea.get(String(idea._id));
        const realizedINR = benefitEntry?.realizedINR || 0;
        const avgScore = evalEntry ? round1(evalEntry.avgScore) : null;
        const estimated = idea.estimatedValueINR;
        const signals = [];
        if (realizedINR > 0) signals.push('realized_value');
        if (estimated) signals.push('estimated_value');
        if (idea.isFeatured) signals.push('featured');
        if (avgScore !== null && avgScore >= STRONG_EVAL_SCORE) signals.push('strong_evaluation');
        if (APPROVED_STATUSES.includes(idea.status)) signals.push('approved');
        return {
          ideaId: idea._id,
          humanId: idea.ideaId,
          title: idea.title,
          department: idea.department,
          status: idea.status,
          owner: idea.submittedBy?.name || null,
          estimatedINR: estimated ?? null, // field absent on pre-existing docs
          realizedINR,
          endorsed: benefitEntry?.endorsed || false,
          avgScore,
          evaluators: evalEntry?.evaluators || 0,
          isFeatured: idea.isFeatured || false,
          signals,
          signalScore:
            (realizedINR > 0 ? 4 : 0) +
            (estimated ? 2 : 0) +
            (avgScore !== null && avgScore >= STRONG_EVAL_SCORE ? 2 : 0) +
            (idea.isFeatured ? 1 : 0) +
            (APPROVED_STATUSES.includes(idea.status) ? 1 : 0),
        };
      })
      .filter((i) => i.signalScore > 0)
      .sort((a, b) => b.signalScore - a.signalScore || (b.realizedINR || 0) - (a.realizedINR || 0))
      .slice(0, 6);

    // ── 3. Recent strategic activity (idea workflow events only) ──
    const logIdeaIds = logs
      .map((l) => l.entityId)
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(String(id)));
    const logIdeas = await Idea.find({ _id: { $in: logIdeaIds } })
      .select('title ideaId')
      .lean();
    const titleById = new Map(logIdeas.map((i) => [String(i._id), { title: i.title, humanId: i.ideaId }]));

    const activity = logs
      .map((log) => {
        const ideaInfo = titleById.get(String(log.entityId));
        if (!ideaInfo) return null; // idea deleted since the event
        const newStatus = log.afterState?.status;
        return {
          action: log.action,
          newStatus: newStatus || null,
          actor: log.actorId?.name || 'System',
          timestamp: log.timestamp,
          ideaId: log.entityId,
          ideaTitle: ideaInfo.title,
          humanId: ideaInfo.humanId,
        };
      })
      .filter(Boolean);

    const data = {
      generatedAt: now.toISOString(),
      attention: attention.slice(0, 9),
      strategic,
      activity,
      definitions: {
        attention:
          'Rule-based items only: (1) ideas that breached their review SLA, (2) implementations past target date, (3) approved ideas with no implementation record. Sorted by severity, then age.',
        strategic:
          'Ideas carrying at least one executive signal: realized value, submitter estimate, featured flag, average evaluator score ≥ 7/10, or committee approval. Ranked by signal strength.',
        activity: 'Latest workflow events on ideas from the audit trail (status changes, approvals, rejections, publications).',
      },
    };

    cache.set(cacheKey, data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
