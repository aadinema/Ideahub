/**
 * server/__tests__/authorization.test.js
 * Regression tests for object-level authorization on benefits and implementations.
 *
 * Ensures:
 * - Unrelated users are denied access
 * - Submitters can read but not create implementations
 * - Implementation owners can create/read benefits
 * - Committee members can access ideas in workflow
 * - Admin can access anything
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Idea = require('../models/Idea');
const Implementation = require('../models/Implementation');
const Benefit = require('../models/Benefit');
const { ROLES, IDEA_STATUS, ENDORSEMENT_STATUS } = require('../../shared/constants');

// Helper to generate JWT
const generateToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { sub: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

describe('Authorization Tests — Benefits and Implementations', () => {
  let submitterUser, ownerUser, unrelatejuserUser, adminUser;
  let submitterToken, ownerToken, unrelatedToken, adminToken;
  let ideaData, implementationData;

  beforeAll(async () => {
    // Isolation: clear fixtures from any interrupted previous run.
    // (jest.setup.js points MONGODB_URI at the dedicated ideahub_test DB —
    // destructive cleanups must never touch development data.)
    await User.deleteMany({});
    await Idea.deleteMany({});
    await Implementation.deleteMany({});
    await Benefit.deleteMany({});

    // Create test users with different roles
    submitterUser = await User.create({
      name: 'Idea Submitter',
      email: 'submitter@test.com',
      password: 'HashedPass123',
      employeeId: 'EMP001',
      department: 'Engineering',
      roles: [ROLES.EMPLOYEE],
      isActive: true,
    });

    ownerUser = await User.create({
      name: 'Implementation Owner',
      email: 'owner@test.com',
      password: 'HashedPass123',
      employeeId: 'EMP002',
      department: 'Engineering',
      // Realistic: an implementation owner also holds the implementation_owner
      // role — the workflow role map requires it for progress/benefits
      // transitions (workflowService.TRANSITION_ROLE_MAP).
      roles: [ROLES.EMPLOYEE, ROLES.IMPLEMENTATION_OWNER],
      isActive: true,
    });

    unrelatedUser = await User.create({
      name: 'Unrelated User',
      email: 'unrelated@test.com',
      password: 'HashedPass123',
      employeeId: 'EMP003',
      department: 'Sales',
      roles: [ROLES.EMPLOYEE],
      isActive: true,
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'HashedPass123',
      employeeId: 'ADMIN001',
      department: 'Admin',
      roles: [ROLES.ADMIN],
      isActive: true,
    });

    // Generate tokens
    submitterToken = generateToken(submitterUser._id);
    ownerToken = generateToken(ownerUser._id);
    unrelatedToken = generateToken(unrelatedUser._id);
    adminToken = generateToken(adminUser._id);

    // Create a published idea for testing
    ideaData = await Idea.create({
      title: 'Test Idea for Auth',
      category: 'Process Improvement',
      benefitTypes: ['process_optimization'],
      department: 'Engineering',
      problemStatement: 'This is a test problem statement for authorization testing',
      proposedSolution: 'This is a test solution for authorization testing',
      submittedBy: submitterUser._id,
      status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      isActive: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Idea.deleteMany({});
    await Implementation.deleteMany({});
    await Benefit.deleteMany({});
  });

  describe('Implementation Authorization', () => {
    let testImplementation;

    beforeAll(async () => {
      // Create implementation with ownerUser as owner
      testImplementation = await Implementation.create({
        ideaId: ideaData._id,
        ownerId: ownerUser._id,
        department: 'Engineering',
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progressPercent: 0,
      });
    });

    test('[DENY] Unrelated user cannot read implementation details', async () => {
      const res = await request(app)
        .get(`/api/implementations/ideas/${ideaData._id}`)
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    test('[ALLOW] Idea submitter can read implementation details', async () => {
      const res = await request(app)
        .get(`/api/implementations/ideas/${ideaData._id}`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.ideaId._id).toEqual(ideaData._id.toString());
    });

    test('[ALLOW] Implementation owner can read implementation details', async () => {
      const res = await request(app)
        .get(`/api/implementations/ideas/${ideaData._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.ownerId._id).toEqual(ownerUser._id.toString());
    });

    test('[ALLOW] Admin can read implementation details', async () => {
      const res = await request(app)
        .get(`/api/implementations/ideas/${ideaData._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    test('[DENY] Unrelated user cannot create implementation', async () => {
      // Create a new idea ready for implementation
      const newIdea = await Idea.create({
        title: 'Another Test Idea',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement: 'Another test problem statement for authorization testing, padded to fifty characters.',
        proposedSolution: 'Another test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      });

      const res = await request(app)
        .post('/api/implementations')
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .send({
          ideaId: newIdea._id,
          ownerId: ownerUser._id,
          department: 'Engineering',
          startDate: new Date(),
          targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    test('[ALLOW] Admin can create implementation with valid owner', async () => {
      // Create a new idea ready for implementation
      const newIdea = await Idea.create({
        title: 'Third Test Idea',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement: 'Third test problem statement for authorization testing, padded to fifty characters.',
        proposedSolution: 'Third test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      });

      const res = await request(app)
        .post('/api/implementations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ideaId: newIdea._id,
          ownerId: ownerUser._id,
          department: 'Engineering',
          startDate: new Date(),
          targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.ownerId).toEqual(ownerUser._id.toString());
    });

    test('[DENY] Cannot create implementation with inactive owner', async () => {
      // Deactivate owner
      await User.updateOne({ _id: ownerUser._id }, { isActive: false });

      const newIdea = await Idea.create({
        title: 'Fourth Test Idea',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement: 'Fourth test problem statement for authorization testing, padded to fifty characters.',
        proposedSolution: 'Fourth test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      });

      const res = await request(app)
        .post('/api/implementations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ideaId: newIdea._id,
          ownerId: ownerUser._id,
          department: 'Engineering',
          startDate: new Date(),
          targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not active');

      // Reactivate for future tests
      await User.updateOne({ _id: ownerUser._id }, { isActive: true });
    });
  });

  describe('Benefit Authorization', () => {
    let testImplementation;

    beforeAll(async () => {
      // Create a fresh idea for benefit tests
      ideaData = await Idea.create({
        title: 'Benefit Test Idea',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement: 'Benefit test problem statement for authorization testing, padded to fifty characters.',
        proposedSolution: 'Benefit test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.IMPLEMENTATION_COMPLETED,
      });

      testImplementation = await Implementation.create({
        ideaId: ideaData._id,
        ownerId: ownerUser._id,
        department: 'Engineering',
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progressPercent: 100,
      });
    });

    test('[DENY] Unrelated user cannot read benefit', async () => {
      // Create a benefit first
      const benefit = await Benefit.create({
        ideaId: ideaData._id,
        implementationId: testImplementation._id,
        financial: { costSavingsINR: 50000 },
        operational: { description: 'Test operational benefit description here' },
        endorsementStatus: ENDORSEMENT_STATUS.PENDING,
        recordedBy: ownerUser._id,
      });

      const res = await request(app)
        .get(`/api/benefits/ideas/${ideaData._id}`)
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    test('[ALLOW] Idea submitter can read benefit', async () => {
      const res = await request(app)
        .get(`/api/benefits/ideas/${ideaData._id}`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    test('[ALLOW] Implementation owner can create benefit', async () => {
      const newIdea = await Idea.create({
        title: 'Benefit Creation Test',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement: 'Benefit creation test problem statement for authorization testing, fifty characters.',
        proposedSolution: 'Benefit creation test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.IMPLEMENTATION_COMPLETED,
      });

      const newImplementation = await Implementation.create({
        ideaId: newIdea._id,
        ownerId: ownerUser._id,
        department: 'Engineering',
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progressPercent: 100,
      });

      const res = await request(app)
        .post('/api/benefits')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ideaId: newIdea._id,
          implementationId: newImplementation._id,
          financial: { costSavingsINR: 100000 },
          operational: { description: 'This is a valid operational benefit description for testing' },
          strategic: {},
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    test('[DENY] Unrelated user cannot create benefit', async () => {
      const newIdea = await Idea.create({
        title: 'Benefit Deny Test',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement: 'Benefit deny test problem statement for authorization testing, padded to fifty chars.',
        proposedSolution: 'Benefit deny test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.IMPLEMENTATION_COMPLETED,
      });

      const newImplementation = await Implementation.create({
        ideaId: newIdea._id,
        ownerId: ownerUser._id,
        department: 'Engineering',
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progressPercent: 100,
      });

      const res = await request(app)
        .post('/api/benefits')
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .send({
          ideaId: newIdea._id,
          implementationId: newImplementation._id,
          financial: { costSavingsINR: 50000 },
          operational: { description: 'This is a valid operational benefit description for testing' },
          strategic: {},
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('implementation owner or an administrator');
    });

    test('[ALLOW] Admin can read and create benefits', async () => {
      const newIdea = await Idea.create({
        title: 'Admin Benefit Test',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement: 'Admin benefit test problem statement for authorization testing, fifty characters.',
        proposedSolution: 'Admin benefit test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.IMPLEMENTATION_COMPLETED,
      });

      const newImplementation = await Implementation.create({
        ideaId: newIdea._id,
        ownerId: ownerUser._id,
        department: 'Engineering',
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progressPercent: 100,
      });

      const createRes = await request(app)
        .post('/api/benefits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ideaId: newIdea._id,
          implementationId: newImplementation._id,
          financial: { costSavingsINR: 75000 },
          operational: { description: 'This is a valid operational benefit description for testing' },
          strategic: {},
        })
        .expect(201);

      expect(createRes.body.success).toBe(true);

      const readRes = await request(app)
        .get(`/api/benefits/ideas/${newIdea._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(readRes.body.success).toBe(true);
    });
  });

  describe('Implementation owner eligibility (KI-005)', () => {
    const future = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const makeApprovedIdea = (title) =>
      Idea.create({
        title,
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement:
          'Owner eligibility test problem statement padded to at least fifty characters long.',
        proposedSolution: 'Owner eligibility test solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      });

    test('[DENY] createImplementation rejects an active same-dept user WITHOUT the implementation_owner role', async () => {
      const noRole = await User.create({
        name: 'No Role User',
        email: 'norole@test.com',
        password: 'HashedPass123',
        employeeId: 'EMP-NOROLE',
        department: 'Engineering',
        roles: [ROLES.EMPLOYEE],
        isActive: true,
      });
      const idea = await makeApprovedIdea('No-role owner rejection idea');

      const res = await request(app)
        .post('/api/implementations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ideaId: idea._id,
          ownerId: noRole._id,
          department: 'Engineering',
          startDate: new Date(),
          targetCompletionDate: future(),
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/implementation_owner role/i);
    });

    test('[ALLOW] createImplementation accepts an eligible role-holding owner', async () => {
      const eligible = await User.create({
        name: 'Eligible Owner',
        email: 'eligible@test.com',
        password: 'HashedPass123',
        employeeId: 'EMP-ELIG',
        department: 'Engineering',
        roles: [ROLES.EMPLOYEE, ROLES.IMPLEMENTATION_OWNER],
        isActive: true,
      });
      const idea = await makeApprovedIdea('Eligible owner acceptance idea');

      const res = await request(app)
        .post('/api/implementations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ideaId: idea._id,
          ownerId: eligible._id,
          department: 'Engineering',
          startDate: new Date(),
          targetCompletionDate: future(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.ownerId).toBeDefined();
    });

    test('[DENY] committee approve-implementation rejects a non-existent owner (not 500)', async () => {
      const idea = await Idea.create({
        title: 'Committee owner validation idea',
        category: 'Process Improvement',
        benefitTypes: ['process_optimization'],
        department: 'Engineering',
        problemStatement:
          'Committee owner validation problem statement padded beyond fifty characters.',
        proposedSolution: 'Committee owner validation solution',
        submittedBy: submitterUser._id,
        status: IDEA_STATUS.UNDER_COMMITTEE_REVIEW,
      });

      const res = await request(app)
        .post(`/api/committee/ideas/${idea._id}/approve-implementation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          comment: 'Assigning a bogus owner id to prove validation runs before create.',
          implementationOwnerId: new mongoose.Types.ObjectId().toString(),
        });

      expect([400, 404]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });
  });
});
