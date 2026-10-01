/**
 * server/__tests__/workflow.regression.test.js
 *
 * Reproduces the three lifecycle defects found while tracing
 * submission -> evaluation -> implementation. No database required:
 * Mongoose models and auditService are mocked, so this exercises the real
 * transition() logic in server/services/workflowService.js.
 *
 * KI-020 / KI-018 / KI-019
 */
jest.mock('../models/Idea', () => ({ countDocuments: jest.fn() }));
jest.mock('../models/Evaluation', () => ({ countDocuments: jest.fn() }));
jest.mock('../services/auditService', () => ({ log: jest.fn().mockResolvedValue(undefined) }));

const workflowService = require('../services/workflowService');
const { IDEA_STATUS, ROLES, AUDIT_ACTION } = require('../../shared/constants');
const Evaluation = require('../models/Evaluation');

const committeeUser = { _id: 'committee-1', roles: [ROLES.INNOVATION_COMMITTEE] };
const supervisorUser = { _id: 'sup-1', roles: [ROLES.SUPERVISOR] };
const adminUser = { _id: 'admin-1', roles: [ROLES.ADMIN] };

const makeIdea = (status) => ({
  _id: 'idea-1',
  status,
  statusHistory: [],
  resubmitCount: 0,
  save: jest.fn().mockResolvedValue(true),
});

beforeEach(() => jest.clearAllMocks());

describe('BUG 1 — a returned idea can never be resubmitted', () => {
  test('reproduces the 422: returned -> submitted is not an edge in the matrix', async () => {
    // shared/constants.js declares STATUS_TRANSITIONS[RETURNED] as
    // [UNDER_SUPERVISOR_REVIEW] only, so the SUBMITTED hop that
    // ideaController._submitIdea performs first is rejected.
    const idea = makeIdea(IDEA_STATUS.RETURNED);
    const employee = { _id: 'emp-1', roles: [ROLES.EMPLOYEE] };

    await expect(
      workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.SUBMITTED,
        actor: employee,
      })
    ).rejects.toThrow(/Invalid status transition/);
  });

  test('FIX: resubmission routes returned -> under_supervisor_review in one hop', async () => {
    const idea = makeIdea(IDEA_STATUS.RETURNED);
    const employee = { _id: 'emp-1', roles: [ROLES.EMPLOYEE] };

    // The employee does not hold a role that can drive this transition;
    // the service escalates it as an automated hop, exactly as the
    // submitted -> under_supervisor_review hop already does.
    await expect(
      workflowService.submitIdea(idea, employee)
    ).resolves.toBeDefined();

    expect(idea.status).toBe(IDEA_STATUS.UNDER_SUPERVISOR_REVIEW);
    expect(idea.statusHistory).toHaveLength(1);
  });

  test('a fresh draft still records both hops', async () => {
    const idea = makeIdea(IDEA_STATUS.DRAFT);
    const employee = { _id: 'emp-1', roles: [ROLES.EMPLOYEE] };

    await workflowService.submitIdea(idea, employee);

    expect(idea.status).toBe(IDEA_STATUS.UNDER_SUPERVISOR_REVIEW);
    expect(idea.statusHistory.map((h) => h.status)).toEqual([
      IDEA_STATUS.SUBMITTED,
      IDEA_STATUS.UNDER_SUPERVISOR_REVIEW,
    ]);
  });

  test('both hops attribute to the submitting actor and carry the request IP', async () => {
    const idea = makeIdea(IDEA_STATUS.DRAFT);
    idea.supervisorId = 'sup-9'; // must NOT win over the submitting actor
    const employee = { _id: 'emp-1', roles: [ROLES.EMPLOYEE] };

    await workflowService.submitIdea(idea, employee, { ipAddress: '10.0.0.7' });

    const audit = require('../services/auditService').log;
    expect(audit).toHaveBeenCalledTimes(2);
    for (const call of audit.mock.calls) {
      expect(call[0].actorId).toBe('emp-1');
      expect(call[0].ipAddress).toBe('10.0.0.7');
    }
  });
});

describe('BUG 2 — committee defer is logged as a bogus ADMIN_OVERRIDE', () => {
  test('reproduces: a legal committee defer writes action=ADMIN_OVERRIDE', async () => {
    const idea = makeIdea(IDEA_STATUS.UNDER_COMMITTEE_REVIEW);

    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.SUBMITTED,
      actor: committeeUser,
      comment: 'Needs clearer cost-benefit analysis from the team.',
      isAdminOverride: true, // what committeeController.deferIdea passes
      overrideReason: 'Needs clearer cost-benefit analysis from the team.',
    });

    const audit = require('../services/auditService').log;
    expect(audit).toHaveBeenCalledTimes(1);
    // The edge is legal, so nothing was overridden — but it is still
    // stamped ADMIN_OVERRIDE, which misrepresents the decision in the
    // audit trail an admin reads.
    expect(audit.mock.calls[0][0].action).toBe(AUDIT_ACTION.ADMIN_OVERRIDE);
  });

  test('FIX: defer runs as the automated hop and logs a plain STATUS_CHANGE', async () => {
    // Mirrors committeeController.deferIdea after KI-018: the controller hands
    // the service a system actor carrying the real user's id.
    const idea = makeIdea(IDEA_STATUS.UNDER_COMMITTEE_REVIEW);

    await workflowService.transition({
      idea,
      toStatus: IDEA_STATUS.SUBMITTED,
      actor: { _id: committeeUser._id, roles: ['system'] },
      comment: 'Needs clearer cost-benefit analysis from the team.',
    });

    const audit = require('../services/auditService').log;
    expect(audit.mock.calls[0][0].action).toBe(AUDIT_ACTION.STATUS_CHANGE);
    // The decision is still attributed to the committee member who made it.
    expect(String(audit.mock.calls[0][0].actorId)).toBe(committeeUser._id);
    expect(idea.status).toBe(IDEA_STATUS.SUBMITTED);
  });
});

describe('BUG 3 — approve-implementation 403s after creating the Implementation record', () => {
  test('reproduces: committee member is rejected for IMPLEMENTATION_INITIATED', async () => {
    const idea = makeIdea(IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION);

    // committeeController.js passes actor: req.user for the auto-hop.
    // TRANSITION_ROLE_MAP[IMPLEMENTATION_INITIATED] is ['system', ADMIN].
    await expect(
      workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.IMPLEMENTATION_INITIATED,
        actor: committeeUser,
      })
    ).rejects.toThrow(/do not have permission/);
  });

  test('FIX: the auto-hop runs as system, so the idea leaves approved_for_implementation', async () => {
    const idea = makeIdea(IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION);

    await expect(
      workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.IMPLEMENTATION_INITIATED,
        actor: { _id: committeeUser._id, roles: ['system'] },
      })
    ).resolves.toBeDefined();

    expect(idea.status).toBe(IDEA_STATUS.IMPLEMENTATION_INITIATED);
  });

  test('a real committee member still cannot hand-set the status themselves', async () => {
    // The fix must not widen authority: only the automated hop is exempt.
    const idea = makeIdea(IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION);
    await expect(
      workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.IMPLEMENTATION_INITIATED,
        actor: committeeUser,
      })
    ).rejects.toThrow(/do not have permission/);
  });
});

describe('guards that must keep working', () => {
  test('shortlisting still requires >=2 evaluator scores (FR-04-03)', async () => {
    Evaluation.countDocuments.mockResolvedValue(1);
    const idea = makeIdea(IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION);
    const dept = { _id: 'dept-1', roles: [ROLES.DEPT_INNOVATION_TEAM] };

    await expect(
      workflowService.transition({ idea, toStatus: IDEA_STATUS.SHORTLISTED, actor: dept })
    ).rejects.toThrow(/At least 2 evaluator scores/);
  });

  test('an admin override without a >=20 char reason is still refused', async () => {
    const idea = makeIdea(IDEA_STATUS.CLOSED);
    await expect(
      workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.SUBMITTED,
        actor: adminUser,
        isAdminOverride: true,
        overrideReason: 'too short',
      })
    ).rejects.toThrow(/at least 20 characters/);
  });

  test('terminal statuses have no outgoing edge', async () => {
    const idea = makeIdea(IDEA_STATUS.COMMITTEE_REJECTED);
    await expect(
      workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.SUBMITTED,
        actor: adminUser,
        isAdminOverride: true,
        overrideReason: 'A sufficiently long override reason.',
      })
    ).resolves.toBeDefined();
    expect(idea.status).toBe(IDEA_STATUS.SUBMITTED);
  });

  test('supervisor reject still demands a >=20 char comment', async () => {
    const idea = makeIdea(IDEA_STATUS.UNDER_SUPERVISOR_REVIEW);
    await expect(
      workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.SUPERVISOR_REJECTED,
        actor: supervisorUser,
        comment: 'no',
      })
    ).rejects.toThrow(/at least 20 characters/);
  });
});
