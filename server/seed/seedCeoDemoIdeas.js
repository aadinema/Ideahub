/**
 * server/seed/seedCeoDemoIdeas.js
 * Richer demo dataset for the CEO / C-Suite dashboard (CEO-01).
 *
 * WHY THIS EXISTS: the development dataset accumulated through manual API
 * testing was destroyed when the backend test suites ran their destructive
 * afterAll cleanups against the shared dev database (they had no database
 * isolation at the time — see jest.setup.js, which now points every test run
 * at `ideahub_test`). This script restores a comparable dataset *through the
 * app's own models*, so every CEO dashboard metric is computed from genuine
 * records (status histories, evaluations, implementations, benefits,
 * audit-trail entries) — nothing on the dashboard is hardcoded.
 *
 * Contents: 32 non-draft ideas + 3 drafts across 4 departments, workflow
 * status histories with realistic timestamps (13–25 Sep 2026), 5 committee
 * evaluations, 3 implementation records (one overdue), 2 benefit records
 * (one endorsed, one pending), matching audit-trail entries, and cleanup of
 * orphaned audit logs / evaluations / notifications left by the destroyed
 * records.
 *
 * Idempotent: skips ideas that already exist (by title), implementations and
 * evaluations that already reference an idea, and rewrites no audit history.
 *
 * Usage:  node seed/seedCeoDemoIdeas.js       (standalone, loads .env)
 *         or via node seed/index.js           (master runner)
 */
require('dotenv').config();

const mongoose = require('mongoose');
const Idea = require('../models/Idea');
const User = require('../models/User');
const Category = require('../models/Category');
const Implementation = require('../models/Implementation');
const Benefit = require('../models/Benefit');
const Evaluation = require('../models/Evaluation');
const EvaluationCriteria = require('../models/EvaluationCriteria');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { IDEA_STATUS, BENEFIT_TYPE, ENDORSEMENT_STATUS } = require('../../shared/constants');

// ── Date helper: local time in September 2026 ────────────────────────────────
const d = (day, h = 10, m = 0) => new Date(2026, 8, day, h, m);
const addDays = (base, days) => new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

// ── Workflow chains: current status → full history (offsets in days from createdAt) ──
const CHAINS = {
  [IDEA_STATUS.SUBMITTED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
  ],
  [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
  ],
  [IDEA_STATUS.RETURNED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.RETURNED, 2.5, 'sup'],
  ],
  [IDEA_STATUS.SUPERVISOR_APPROVED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
  ],
  [IDEA_STATUS.SUPERVISOR_REJECTED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_REJECTED, 2, 'sup'],
  ],
  [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
  ],
  [IDEA_STATUS.SHORTLISTED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.SHORTLISTED, 4, 'dept'],
  ],
  [IDEA_STATUS.REJECTED_BY_DEPT]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.REJECTED_BY_DEPT, 3.5, 'dept'],
  ],
  [IDEA_STATUS.UNDER_COMMITTEE_REVIEW]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.SHORTLISTED, 4, 'dept'],
    [IDEA_STATUS.UNDER_COMMITTEE_REVIEW, 5, 'committee'],
  ],
  [IDEA_STATUS.COMMITTEE_REJECTED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.SHORTLISTED, 4, 'dept'],
    [IDEA_STATUS.UNDER_COMMITTEE_REVIEW, 5, 'committee'],
    [IDEA_STATUS.COMMITTEE_REJECTED, 7.5, 'committee'],
  ],
  [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.SHORTLISTED, 4, 'dept'],
    [IDEA_STATUS.UNDER_COMMITTEE_REVIEW, 5, 'committee'],
    [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION, 7, 'committee'],
  ],
  [IDEA_STATUS.PUBLISHED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.SHORTLISTED, 4, 'dept'],
    [IDEA_STATUS.UNDER_COMMITTEE_REVIEW, 5, 'committee'],
    [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION, 7, 'committee'],
    [IDEA_STATUS.PUBLISHED, 7.6, 'admin'],
  ],
  [IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.SHORTLISTED, 4, 'dept'],
    [IDEA_STATUS.UNDER_COMMITTEE_REVIEW, 5, 'committee'],
    [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION, 7, 'committee'],
    [IDEA_STATUS.PUBLISHED, 7.6, 'admin'],
    [IDEA_STATUS.IMPLEMENTATION_INITIATED, 8, 'impl'],
    [IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS, 9, 'impl'],
  ],
  [IDEA_STATUS.BENEFITS_RECORDED]: [
    [IDEA_STATUS.DRAFT, 0, 'owner'],
    [IDEA_STATUS.SUBMITTED, 0.4, 'owner'],
    [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, 1, 'sup'],
    [IDEA_STATUS.SUPERVISOR_APPROVED, 1.5, 'sup'],
    [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, 2, 'dept'],
    [IDEA_STATUS.SHORTLISTED, 4, 'dept'],
    [IDEA_STATUS.UNDER_COMMITTEE_REVIEW, 5, 'committee'],
    [IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION, 7, 'committee'],
    [IDEA_STATUS.PUBLISHED, 7.6, 'admin'],
    [IDEA_STATUS.IMPLEMENTATION_INITIATED, 8, 'impl'],
    [IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS, 9, 'impl'],
    [IDEA_STATUS.IMPLEMENTATION_COMPLETED, 10.5, 'impl'],
    [IDEA_STATUS.BENEFITS_RECORDED, 11, 'impl'],
  ],
  [IDEA_STATUS.DRAFT]: [[IDEA_STATUS.DRAFT, 0, 'owner']],
};

// ── Idea specifications ──────────────────────────────────────────────────────
// dept × submitter chosen so department participation rates stay coherent:
// participants = distinct submitters of ideas in the department, employees =
// active users whose own department matches. ('Finance'/'Human Resources' have
// no employees — the dashboard shows '—' for them, by design.)
const SPECS = [
  // ── Operations (12) ──
  { title: 'Automate weekly operations reporting using Python scripts', dept: 'Operations', by: 'priya', status: IDEA_STATUS.SUBMITTED, day: 13, est: 350000 },
  { title: 'Streamline purchase requisition approvals with digital workflow', dept: 'Operations', by: 'rajesh', status: IDEA_STATUS.SUBMITTED, day: 14, est: 600000 },
  { title: 'Standardize vendor onboarding checklist with automated reminders', dept: 'Operations', by: 'anita', status: IDEA_STATUS.SUBMITTED, day: 20, est: 120000 },
  { title: 'Introduce digital shift-handover logbook for plant teams', dept: 'Operations', by: 'priya', status: IDEA_STATUS.SUBMITTED, day: 24, est: 80000 },
  { title: 'Reduce inventory reconciliation time with barcode scanning', dept: 'Operations', by: 'rajesh', status: IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, day: 14, est: 900000 },
  { title: 'Centralize facilities maintenance requests in one portal', dept: 'Operations', by: 'anita', status: IDEA_STATUS.UNDER_SUPERVISOR_REVIEW, day: 21 },
  { title: 'Digital visitor management kiosk for reception', dept: 'Operations', by: 'priya', status: IDEA_STATUS.RETURNED, day: 13, est: 150000 },
  { title: 'Automate expense report audit sampling', dept: 'Operations', by: 'rajesh', status: IDEA_STATUS.RETURNED, day: 15, est: 220000 },
  { title: 'Chatbot for internal HR policy queries', dept: 'Operations', by: 'anita', status: IDEA_STATUS.RETURNED, day: 18, est: 400000 },
  { title: 'Predictive maintenance schedule for packaging line', dept: 'Operations', by: 'priya', status: IDEA_STATUS.SUPERVISOR_APPROVED, day: 14, est: 1200000 },
  { title: 'Self-service portal for leave and attendance corrections', dept: 'Operations', by: 'rajesh', status: IDEA_STATUS.SUPERVISOR_APPROVED, day: 16, est: 180000 },
  { title: 'Energy consumption dashboard for plant utilities', dept: 'Operations', by: 'anita', status: IDEA_STATUS.SUPERVISOR_APPROVED, day: 22, est: 260000 },

  // ── IT (12) ──
  { title: 'Migrate legacy intranet to a modern SSO-enabled platform', dept: 'IT', by: 'neha', status: IDEA_STATUS.SUPERVISOR_REJECTED, day: 15, est: 800000 },
  { title: 'Automated database backup verification tool', dept: 'IT', by: 'neha', status: IDEA_STATUS.SUPERVISOR_REJECTED, day: 17 },
  { title: 'Endpoint patch compliance dashboard for IT operations', dept: 'IT', by: 'neha', status: IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, day: 14, est: 450000 },
  { title: 'CI/CD pipeline flakiness analyzer', dept: 'IT', by: 'neha', status: IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, day: 16, est: 300000 },
  { title: 'Internal API gateway for microservices', dept: 'IT', by: 'neha', status: IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, day: 19, est: 1500000 },
  { title: 'Self-healing restart for stateless services', dept: 'IT', by: 'neha', status: IDEA_STATUS.SHORTLISTED, day: 17, est: 550000 },
  { title: 'Zero-trust network access rollout', dept: 'IT', by: 'neha', status: IDEA_STATUS.SHORTLISTED, day: 20, est: 2200000 },
  { title: 'ML-based ticket routing for the helpdesk', dept: 'IT', by: 'neha', status: IDEA_STATUS.UNDER_COMMITTEE_REVIEW, day: 18, est: 750000 },
  { title: 'Cloud cost anomaly alerting for engineering accounts', dept: 'IT', by: 'neha', status: IDEA_STATUS.COMMITTEE_REJECTED, day: 16, est: 660000 },
  { title: 'Serverless data lake for cross-team analytics', dept: 'IT', by: 'neha', status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION, day: 15, est: 4000000 },
  { title: 'ChatOps integration for faster incident response', dept: 'IT', by: 'neha', status: IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS, day: 14, est: 950000 },
  { title: 'Automated access revocation on employee exit', dept: 'IT', by: 'neha', status: IDEA_STATUS.BENEFITS_RECORDED, day: 13, est: 480000 },

  // ── Finance (4) ──
  { title: 'Auto-reconcile T&E claims against corporate card feeds', dept: 'Finance', by: 'suresh', status: IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, day: 18, est: 500000 },
  { title: 'Predictive cash-flow forecasting model', dept: 'Finance', by: 'suresh', status: IDEA_STATUS.COMMITTEE_REJECTED, day: 17, est: 1250000 },
  { title: 'Digital vendor payment approval chain', dept: 'Finance', by: 'suresh', status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION, day: 16, est: 320000 },
  { title: 'Real-time budget utilization tracker', dept: 'Finance', by: 'suresh', status: IDEA_STATUS.BENEFITS_RECORDED, day: 14, est: 240000 },

  // ── Human Resources (4) ──
  { title: 'Resume-blind initial screening workflow', dept: 'Human Resources', by: 'suresh', status: IDEA_STATUS.REJECTED_BY_DEPT, day: 19 },
  { title: 'Employee pulse survey automation', dept: 'Human Resources', by: 'suresh', status: IDEA_STATUS.REJECTED_BY_DEPT, day: 21, est: 60000 },
  { title: 'Learning-path recommendations engine', dept: 'Human Resources', by: 'suresh', status: IDEA_STATUS.UNDER_COMMITTEE_REVIEW, day: 18, est: 680000 },
  { title: 'Onboarding buddy matching program', dept: 'Human Resources', by: 'suresh', status: IDEA_STATUS.PUBLISHED, day: 17, est: 110000 },

  // ── Drafts (3, excluded from dashboard KPIs by design) ──
  { title: 'Draft: quarterly quality metrics refresh', dept: 'Operations', by: 'priya', status: IDEA_STATUS.DRAFT, day: 23 },
  { title: 'Draft: employee carpool incentive pilot', dept: 'Operations', by: 'rajesh', status: IDEA_STATUS.DRAFT, day: 24 },
  { title: 'Draft: legacy CRM decommission plan', dept: 'IT', by: 'neha', status: IDEA_STATUS.DRAFT, day: 25 },
];

const PROBLEMS = [
  'Teams still compile critical reports by hand from several systems, which costs many hours each week and introduces avoidable errors before decisions reach leadership.',
  'The current process depends on manual checks, email approvals and spreadsheet tracking, which slows turnaround time and makes status visibility difficult for everyone involved.',
  'Existing tooling leaves significant room for automation: staff repeat the same routine steps every cycle, and delays accumulate into measurable cost and quality impact over time.',
];
const SOLUTIONS = [
  'Build an integrated workflow that automates the routine steps, notifies the right owners at each stage, and gives managers a real-time dashboard of progress and bottlenecks.',
  'Introduce a self-service portal backed by validation rules and automated reminders so requests are processed consistently, with a full audit trail for every decision.',
];

// ── Evaluations: [ideaTitleMatch, evaluator, scores(1-10 per criterion), decision] ──
const EVALS = [
  { title: 'ML-based ticket routing for the helpdesk', by: 'vikram', scores: [8, 7, 9, 8, 7, 8, 9, 7, 8], decision: 'shortlist',
    comments: 'Strong measurable impact on support resolution time; clear ownership and realistic delivery plan.' },
  { title: 'Learning-path recommendations engine', by: 'vikram', scores: [8, 6, 7, 7, 6, 8, 7, 6, 7], decision: 'shortlist',
    comments: 'Good strategic fit for capability building; recommend scoping a pilot with one department first.' },
  { title: 'Cloud cost anomaly alerting for engineering accounts', by: 'vikram', scores: [5, 4, 6, 5, 4, 5, 6, 4, 5], decision: 'reject',
    comments: 'Value is real but overlaps with an existing vendor contract; revisit once the current term ends.' },
  { title: 'Predictive cash-flow forecasting model', by: 'vikram', scores: [5, 5, 6, 5, 4, 5, 6, 5, 5], decision: 'reject',
    comments: 'Data readiness is insufficient this quarter; requires cleaner historical ledgers before re-proposing.' },
  { title: 'Self-healing restart for stateless services', by: 'anita', scores: [9, 7, 8, 8, 7, 8, 8, 7, 8], decision: 'shortlist',
    comments: 'Excellent reliability payoff with low implementation risk; well documented rollback strategy.' },
];

const seedCeoDemoIdeas = async () => {
  // ── People ──
  const byEmail = async (email) => User.findOne({ email }).lean();
  const [priya, rajesh, anita, vikram, neha, suresh, admin] = await Promise.all([
    byEmail('employee@ideahub.local'),
    byEmail('supervisor@ideahub.local'),
    byEmail('dept.team@ideahub.local'),
    byEmail('committee@ideahub.local'),
    byEmail('impl.owner@ideahub.local'),
    byEmail('dept.team2@ideahub.local'),
    byEmail('admin@ideahub.local'),
  ]);
  if (!priya || !rajesh || !anita || !vikram || !neha || !suresh || !admin) {
    logger.warn('seedCeoDemoIdeas: demo users missing — run seedUsers first.');
    return;
  }
  const people = { priya, rajesh, anita, vikram, neha, suresh, admin };
  const actors = (spec) => ({
    owner: spec.by,
    sup: 'rajesh',
    dept: 'anita',
    committee: 'vikram',
    admin: 'admin',
    impl: spec.by === 'neha' ? 'neha' : 'admin',
  });

  const categories = (await Category.find({}).select('name').lean()).map((c) => c.name);
  const categoryName = categories[0] || 'Process Improvement';

  // ── Ideas ──
  let created = 0;
  const createdIdeas = [];
  for (let i = 0; i < SPECS.length; i++) {
    const spec = SPECS[i];
    const existing = await Idea.findOne({ title: spec.title });
    if (existing) continue;

    const createdAt = d(spec.day, 9, 30);
    const roleMap = actors(spec);
    const statusHistory = CHAINS[spec.status].map(([status, offset, actorKey]) => ({
      status,
      actor: people[roleMap[actorKey]]._id,
      comment: '',
      timestamp: addDays(createdAt, offset),
    }));

    const idea = await Idea.create({
      title: spec.title,
      category: categoryName,
      department: spec.dept,
      problemStatement: PROBLEMS[i % PROBLEMS.length],
      proposedSolution: SOLUTIONS[i % SOLUTIONS.length],
      benefitTypes: [BENEFIT_TYPE.PROCESS_OPTIMIZATION],
      submittedBy: people[spec.by]._id,
      supervisorId: rajesh._id,
      status: spec.status,
      statusHistory,
      estimatedValueINR: spec.est ?? null,
      createdAt,
    });
    createdIdeas.push(idea);
    created++;
  }
  logger.info(`seedCeoDemoIdeas: ideas created: ${created} (skipped ${SPECS.length - created} existing).`);

  // ── Audit-trail entries mirroring workflowService.transition output ──
  let auditCreated = 0;
  for (const idea of createdIdeas) {
    const history = idea.statusHistory;
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      await AuditLog.create({
        actorId: entry.actor,
        action: i === 0 ? 'create' : 'status_change',
        entityType: 'Idea',
        entityId: idea._id.toString(),
        beforeState: i > 0 ? { status: history[i - 1].status } : null,
        afterState: { status: entry.status },
        timestamp: entry.timestamp,
      });
      auditCreated++;
    }
  }
  logger.info(`seedCeoDemoIdeas: audit entries created: ${auditCreated}.`);

  // ── Implementations ──
  const implSpecs = [
    { title: 'ChatOps integration for faster incident response', owner: neha, start: d(22, 10), target: d(24, 18), progress: 45 },
    { title: 'Automated access revocation on employee exit', owner: neha, start: d(21, 10), target: d(25, 18), progress: 100 },
    { title: 'Real-time budget utilization tracker', owner: admin, start: d(22, 10), target: d(25, 18), progress: 100 },
  ];
  const implByTitle = new Map();
  for (const s of implSpecs) {
    const idea = await Idea.findOne({ title: s.title });
    if (!idea) continue;
    let impl = await Implementation.findOne({ ideaId: idea._id });
    if (!impl) {
      impl = await Implementation.create({
        ideaId: idea._id,
        ownerId: s.owner._id,
        department: idea.department,
        startDate: s.start,
        targetCompletionDate: s.target,
        progressPercent: s.progress,
        milestones: [],
      });
    }
    implByTitle.set(s.title, impl);
  }
  logger.info(`seedCeoDemoIdeas: implementations ready: ${implByTitle.size}.`);

  // ── Benefits (one endorsed, one pending — realized value for the dashboard) ──
  const benefitSpecs = [
    { title: 'Automated access revocation on employee exit', cost: 120000, status: ENDORSEMENT_STATUS.ENDORSED,
      desc: 'Reduces manual offboarding effort by an estimated 4 hours per exit and closes the access-audit compliance gap identified in the last review.' },
    { title: 'Real-time budget utilization tracker', cost: 450000, status: ENDORSEMENT_STATUS.PENDING,
      desc: 'Finance teams stop building manual budget workbooks each month, saving roughly 3 person-days per cycle across reporting and variance analysis.' },
  ];
  let benefits = 0;
  for (const s of benefitSpecs) {
    const impl = implByTitle.get(s.title);
    const idea = await Idea.findOne({ title: s.title });
    if (!impl || !idea) continue;
    const exists = await Benefit.findOne({ ideaId: idea._id });
    if (exists) continue;
    await Benefit.create({
      ideaId: idea._id,
      implementationId: impl._id,
      financial: { costSavingsINR: s.cost, revenueIncreaseINR: 0, evidenceAttachments: [] },
      operational: { efficiencyImprovementPct: 20, productivityGainPct: 15, description: s.desc },
      strategic: { customerSatisfactionChange: null, innovationImpactRating: null },
      endorsementStatus: s.status,
      verifiedBy: s.status === ENDORSEMENT_STATUS.ENDORSED ? vikram._id : null,
      recordedBy: idea.department === 'Finance' ? admin._id : neha._id,
    });
    benefits++;
  }
  logger.info(`seedCeoDemoIdeas: benefits created: ${benefits}.`);

  // ── Evaluations (snapshot scores against active criteria, weights included) ──
  const criteria = await EvaluationCriteria.find({ isActive: true }).lean();
  let evals = 0;
  for (const e of EVALS) {
    const idea = await Idea.findOne({ title: e.title });
    if (!idea) continue;
    const dup = await Evaluation.findOne({ ideaId: idea._id, evaluatorId: people[e.by]._id });
    if (dup) continue;
    if (criteria.length === 0) break;

    const scores = criteria.slice(0, e.scores.length).map((c, idx) => ({
      criterion: c.criterionName,
      criteriaId: c._id,
      score: e.scores[idx],
      weight: c.weight,
    }));
    const weightedTotal = Math.round(
      scores.reduce((sum, s) => sum + s.score * s.weight, 0) * 100
    ) / 100;

    await Evaluation.create({
      ideaId: idea._id,
      evaluatorId: people[e.by]._id,
      scores,
      weightedTotal,
      comments: e.comments,
      decision: e.decision,
      criteriaVersion: criteria[0].version || 1,
    });
    evals++;
  }
  logger.info(`seedCeoDemoIdeas: evaluations created: ${evals}.`);

  // ── Cleanup: orphaned records left behind by the destroyed dataset ──
  const ideaIds = (await Idea.find({}).select('_id').lean()).map((i) => String(i._id));
  const ideaIdSet = new Set(ideaIds);

  const deadIdeaLogs = await AuditLog.find({ entityType: 'Idea' })
    .select('_id entityId')
    .lean()
    .then((logs) => logs.filter((l) => !ideaIdSet.has(String(l.entityId))).map((l) => l._id));
  if (deadIdeaLogs.length) {
    await AuditLog.deleteMany({ _id: { $in: deadIdeaLogs } });
  }

  const evalsOrphans = await Evaluation.find({})
    .select('_id ideaId')
    .lean()
    .then((rows) => rows.filter((r) => !ideaIdSet.has(String(r.ideaId))).map((r) => r._id));
  if (evalsOrphans.length) {
    await Evaluation.deleteMany({ _id: { $in: evalsOrphans } });
  }

  const userIds = new Set((await User.find({}).select('_id').lean()).map((u) => String(u._id)));
  const notifOrphans = await Notification.find({})
    .select('_id recipientId')
    .lean()
    .then((rows) => rows.filter((r) => !userIds.has(String(r.recipientId))).map((r) => r._id));
  if (notifOrphans.length) {
    await Notification.deleteMany({ _id: { $in: notifOrphans } });
  }
  logger.info(
    `seedCeoDemoIdeas: cleaned orphaned audit logs: ${deadIdeaLogs.length}, evaluations: ${evalsOrphans.length}, notifications: ${notifOrphans.length}.`
  );
};

// Standalone runner
if (require.main === module) {
  const connectDB = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await seedCeoDemoIdeas();
      logger.info('✅ CEO demo dataset ready.');
      process.exit(0);
    } catch (err) {
      logger.error('seedCeoDemoIdeas failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = seedCeoDemoIdeas;
