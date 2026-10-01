/**
 * server/__tests__/committee.controller.test.js
 *
 * Controller-level regression tests for the committee workflow.
 *
 * workflow.regression.test.js covers the state machine itself; these cover the
 * two defects that lived in the *controller*, where the wrong actor or a
 * spurious isAdminOverride flag was passed to workflowService.transition():
 *
 *   KI-021  deferIdea passed isAdminOverride: true on a legal edge, so every
 *           committee defer was written to the audit log as ADMIN_OVERRIDE.
 *   KI-022  approveImplementation auto-transitioned to
 *           IMPLEMENTATION_INITIATED with actor: req.user, which 403s a
 *           committee member *after* the Implementation row was created.
 *
 * Models and services are mocked; no database is required.
 */
jest.mock('../models/Idea', () => ({ findById: jest.fn() }));
jest.mock('../models/Evaluation', () => ({ find: jest.fn().mockResolvedValue([]) }));
jest.mock('../models/Benefit', () => ({}));
jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../models/Implementation', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../services/workflowService', () => ({ transition: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../services/notificationService', () => ({ trigger: jest.fn() }));
jest.mock('../services/auditService', () => ({ log: jest.fn() }));
jest.mock('../services/authorizationService', () => ({
  validateImplementationOwner: jest.fn(),
}));

const committeeController = require('../controllers/committeeController');
const workflowService = require('../services/workflowService');
const Idea = require('../models/Idea');
const Implementation = require('../models/Implementation');
const User = require('../models/User');
const authorizationService = require('../services/authorizationService');
const { IDEA_STATUS, ROLES } = require('../../shared/constants');

const committeeUser = { _id: 'committee-1', roles: [ROLES.INNOVATION_COMMITTEE] };
const ideaDoc = () => ({
  _id: oid('idea-1'),
  status: IDEA_STATUS.UNDER_COMMITTEE_REVIEW,
  submittedBy: 'emp-1',
  department: 'Ops',
  save: jest.fn(),
});

const res = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

// Stands in for an ObjectId: the controller calls .toString() on these ids.
const oid = (v) => ({ _id: v, toString: () => v });

beforeEach(() => {
  jest.clearAllMocks();
  // User.findById(...) is chained with .lean() by the controllers.
  User.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
});

describe('KI-021 — deferIdea', () => {
  test('does not pass isAdminOverride, so a legal defer is not logged as an override', async () => {
    Idea.findById.mockResolvedValue(ideaDoc());

    await committeeController.deferIdea(
      { params: { id: 'idea-1' }, body: { comment: 'Needs a clearer cost-benefit case.' }, user: committeeUser, ip: '127.0.0.1' },
      res(),
      jest.fn()
    );

    const call = workflowService.transition.mock.calls[0][0];
    expect(call.toStatus).toBe(IDEA_STATUS.SUBMITTED);
    expect(call.isAdminOverride).toBeUndefined();
  });

  test('still records the committee member as the actor in the history entry', async () => {
    Idea.findById.mockResolvedValue(ideaDoc());

    await committeeController.deferIdea(
      { params: { id: 'idea-1' }, body: { comment: 'Needs a clearer cost-benefit case.' }, user: committeeUser, ip: '127.0.0.1' },
      res(),
      jest.fn()
    );

    const call = workflowService.transition.mock.calls[0][0];
    expect(call.actor._id).toBe(committeeUser._id);
  });
});

describe('KI-022 — approveImplementation auto-transition', () => {
  test('the IMPLEMENTATION_INITIATED hop runs as system, not as the committee user', async () => {
    Idea.findById.mockResolvedValue(ideaDoc());
    authorizationService.validateImplementationOwner.mockResolvedValue({ _id: 'owner-1', department: 'Ops' });
    Implementation.findOne.mockResolvedValue(null); // no record yet -> the hop must run
    Implementation.create.mockResolvedValue(oid('impl-1'));

    await committeeController.approveImplementation(
      { params: { id: 'idea-1' }, body: { implementationOwnerId: 'owner-1', comment: 'Proceed.' }, user: committeeUser, ip: '127.0.0.1' },
      res(),
      jest.fn()
    );

    const hop = workflowService.transition.mock.calls.find(
      (c) => c[0].toStatus === IDEA_STATUS.IMPLEMENTATION_INITIATED
    );
    expect(hop).toBeDefined();
    // A committee member holds none of the roles gating this status, so the
    // actor must carry 'system' — otherwise the idea is stranded at
    // approved_for_implementation with an orphaned Implementation row.
    expect(hop[0].actor.roles).toEqual(['system']);
    expect(hop[0].actor._id).toBe(committeeUser._id);
  });

  test('the Implementation record is created before the auto-hop, so a failure still orphans it', async () => {
    // Documents the ordering hazard that made KI-022 damaging: if the hop
    // throws, the row is already written. Asserts create() runs first.
    Idea.findById.mockResolvedValue(ideaDoc());
    authorizationService.validateImplementationOwner.mockResolvedValue({ _id: 'owner-1', department: 'Ops' });
    Implementation.findOne.mockResolvedValue(null);
    const order = [];
    Implementation.create.mockImplementation(async () => {
      order.push('create');
      return oid('impl-1');
    });
    workflowService.transition.mockImplementation(async ({ toStatus }) => {
      order.push(toStatus === IDEA_STATUS.IMPLEMENTATION_INITIATED ? 'hop' : 'approve');
    });

    await committeeController.approveImplementation(
      { params: { id: 'idea-1' }, body: { implementationOwnerId: 'owner-1' }, user: committeeUser, ip: '127.0.0.1' },
      res(),
      jest.fn()
    );

    expect(order).toEqual(['approve', 'create', 'hop']);
  });

  test('no auto-hop when an Implementation record already exists', async () => {
    Idea.findById.mockResolvedValue(ideaDoc());
    authorizationService.validateImplementationOwner.mockResolvedValue({ _id: 'owner-1', department: 'Ops' });
    Implementation.findOne.mockResolvedValue(oid('impl-existing'));

    await committeeController.approveImplementation(
      { params: { id: 'idea-1' }, body: { implementationOwnerId: 'owner-1' }, user: committeeUser, ip: '127.0.0.1' },
      res(),
      jest.fn()
    );

    expect(Implementation.create).not.toHaveBeenCalled();
    expect(
      workflowService.transition.mock.calls.some((c) => c[0].toStatus === IDEA_STATUS.IMPLEMENTATION_INITIATED)
    ).toBe(false);
  });
});
