/**
 * server/__tests__/event.test.js
 * FR-IE event management & registration — authorization, validation, visibility,
 * join/close/extend lifecycle and notification wiring.
 *
 * Runs against the isolated `ideahub_test` database (see jest.setup.js).
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const IdeathonEvent = require('../models/IdeathonEvent');
const Notification = require('../models/Notification');
const { ROLES, EVENT_TYPE, EVENT_VISIBILITY, EVENT_STATUS } = require('../../shared/constants');

const generateToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

// notificationService.trigger() is intentionally fire-and-forget, so poll
// briefly rather than asserting on the microtask boundary.
const waitFor = async (fn, { tries = 25, delayMs = 40 } = {}) => {
  for (let i = 0; i < tries; i++) {
    const value = await fn();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
};

const EVENT_NAME_PREFIX = 'Jest Event';

describe('Event management — FR-IE', () => {
  let adminUser, opsUser, itUser;
  let adminToken, opsToken, itToken;

  beforeAll(async () => {
    // Isolation: clear fixtures from any interrupted previous run.
    await User.deleteMany({ email: /@eventtest\.local$/ });
    await IdeathonEvent.deleteMany({ eventName: new RegExp(`^${EVENT_NAME_PREFIX}`) });

    [adminUser, opsUser, itUser] = await Promise.all([
      User.create({
        name: 'Event Admin', email: 'admin@eventtest.local', password: 'HashedPass123',
        employeeId: 'EVT-ADM', department: 'IT', roles: [ROLES.ADMIN], isActive: true,
      }),
      User.create({
        name: 'Ops Employee', email: 'ops@eventtest.local', password: 'HashedPass123',
        employeeId: 'EVT-OPS', department: 'Operations', roles: [ROLES.EMPLOYEE], isActive: true,
      }),
      User.create({
        name: 'IT Employee', email: 'it@eventtest.local', password: 'HashedPass123',
        employeeId: 'EVT-IT', department: 'IT', roles: [ROLES.EMPLOYEE], isActive: true,
      }),
    ]);

    adminToken = generateToken(adminUser._id);
    opsToken = generateToken(opsUser._id);
    itToken = generateToken(itUser._id);
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@eventtest\.local$/ });
    await IdeathonEvent.deleteMany({ eventName: new RegExp(`^${EVENT_NAME_PREFIX}`) });
    await Notification.deleteMany({ recipientId: { $in: [adminUser._id, opsUser._id, itUser._id] } });
    await mongoose.connection.close();
  });

  describe('Validation & authorization', () => {
    test('[DENY] Employee cannot create an event', async () => {
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({ eventName: 'nope', eventType: EVENT_TYPE.IDEATHON, startDate: '2026-10-01', endDate: '2026-10-02' })
        .expect(403);
    });

    test('[DENY] Employee cannot list all events (admin listing)', async () => {
      await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(403);
    });

    test('[VALIDATION] Create rejects missing name/type and bad dates', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ eventName: '', eventType: 'not_a_type', startDate: '2026-10-20', endDate: '2026-10-01' })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    let publishedEventId, restrictedEventId, draftEventId;

    test('[ALLOW] Admin creates published, restricted and draft events', async () => {
      const published = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventName: `${EVENT_NAME_PREFIX} Published`, eventType: EVENT_TYPE.IDEATHON,
          startDate: '2026-10-01', endDate: '2026-10-31',
          visibility: EVENT_VISIBILITY.PUBLISHED, status: EVENT_STATUS.ACTIVE,
          initiative: 'Jest Initiative', ideaCategory: 'Jest Category', maxParticipants: 5,
        })
        .expect(201);
      publishedEventId = published.body.data._id;

      const restricted = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventName: `${EVENT_NAME_PREFIX} Restricted`, eventType: EVENT_TYPE.WORKSHOP,
          startDate: '2026-10-01', endDate: '2026-10-31',
          visibility: EVENT_VISIBILITY.RESTRICTED, targetDepartments: ['IT'],
          status: EVENT_STATUS.ACTIVE,
        })
        .expect(201);
      restrictedEventId = restricted.body.data._id;

      const draft = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventName: `${EVENT_NAME_PREFIX} Draft`, eventType: EVENT_TYPE.IDEATHON,
          startDate: '2026-11-01', endDate: '2026-11-30',
          visibility: EVENT_VISIBILITY.DRAFT, status: EVENT_STATUS.DRAFT,
        })
        .expect(201);
      draftEventId = draft.body.data._id;

      expect(publishedEventId && restrictedEventId && draftEventId).toBeTruthy();
    });

    test('[VISIBILITY] Explore hides drafts and out-of-department restricted events', async () => {
      const res = await request(app)
        .get('/api/events/explore')
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);

      const names = res.body.data.map((e) => e.eventName);
      expect(names).toContain(`${EVENT_NAME_PREFIX} Published`);
      expect(names).not.toContain(`${EVENT_NAME_PREFIX} Draft`);
      expect(names).not.toContain(`${EVENT_NAME_PREFIX} Restricted`);
    });

    test('[VISIBILITY] Draft is not exposed even when explicitly requested', async () => {
      const res = await request(app)
        .get(`/api/events/explore?status=${EVENT_STATUS.DRAFT}`)
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);

      expect(res.body.data.some((e) => e.eventName === `${EVENT_NAME_PREFIX} Draft`)).toBe(false);
    });

    test('[VISIBILITY] Restricted IT event is visible to an IT employee', async () => {
      const res = await request(app)
        .get('/api/events/explore')
        .set('Authorization', `Bearer ${itToken}`)
        .expect(200);

      expect(res.body.data.map((e) => e.eventName)).toContain(`${EVENT_NAME_PREFIX} Restricted`);
    });

    test('[ALLOW] Admin listing includes drafts', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.map((e) => e.eventName)).toContain(`${EVENT_NAME_PREFIX} Draft`);
    });

    test('[FACETS] Returns distinct initiatives and categories', async () => {
      const res = await request(app)
        .get('/api/events/facets')
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);

      expect(res.body.data.initiatives).toContain('Jest Initiative');
      expect(res.body.data.categories).toContain('Jest Category');
    });

    test('[JOIN] Employee joins, is idempotent, and gets a confirmation notification', async () => {
      const join = await request(app)
        .post(`/api/events/${publishedEventId}/join`)
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);
      expect(join.body.success).toBe(true);

      const again = await request(app)
        .post(`/api/events/${publishedEventId}/join`)
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);
      expect(again.body.message).toMatch(/already joined/i);

      const event = await IdeathonEvent.findById(publishedEventId).lean();
      expect(event.participants.map(String)).toContain(opsUser._id.toString());

      // FR-IE-03 — join confirmation notification
      const notif = await waitFor(() => Notification.findOne({
        recipientId: opsUser._id,
        triggerEvent: 'ideathon_join_confirmed',
      }).lean());
      expect(notif).not.toBeNull();
    });

    test('[JOIN] My Events returns joined events', async () => {
      const res = await request(app)
        .get('/api/events/mine')
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);

      expect(res.body.data.map((e) => e._id)).toContain(publishedEventId);
    });

    test('[JOIN] Closed events cannot be joined', async () => {
      await request(app)
        .post(`/api/events/${publishedEventId}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .post(`/api/events/${publishedEventId}/join`)
        .set('Authorization', `Bearer ${itToken}`)
        .expect(400);
    });

    test('[EXTEND] Requires justification and notifies participants (FR-IE-07)', async () => {
      await request(app)
        .post(`/api/events/${restrictedEventId}/join`)
        .set('Authorization', `Bearer ${itToken}`)
        .expect(200);

      await request(app)
        .post(`/api/events/${restrictedEventId}/extend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newEndDate: '2026-11-15', justification: 'short' })
        .expect(422);

      await request(app)
        .post(`/api/events/${restrictedEventId}/extend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newEndDate: '2026-11-15', justification: 'Teams need additional time to submit quality ideas.' })
        .expect(200);

      const event = await IdeathonEvent.findById(restrictedEventId).lean();
      expect(event.endDate.toISOString().slice(0, 10)).toBe('2026-11-15');
      expect(event.extensionHistory.length).toBe(1);

      const notif = await waitFor(() => Notification.findOne({
        recipientId: itUser._id,
        triggerEvent: 'ideathon_extended',
      }).lean());
      expect(notif).not.toBeNull();
    });

    test('[DENY] Employee cannot close or extend events', async () => {
      await request(app)
        .post(`/api/events/${draftEventId}/close`)
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(403);
      await request(app)
        .post(`/api/events/${draftEventId}/extend`)
        .set('Authorization', `Bearer ${opsToken}`)
        .send({ newEndDate: '2026-12-01', justification: 'Trying to extend without permission.' })
        .expect(403);
    });

    test('[LEADERBOARD] Returns 200 with an array', async () => {
      const res = await request(app)
        .get(`/api/events/${publishedEventId}/leaderboard`)
        .set('Authorization', `Bearer ${opsToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Closing reminder job — FRD §11', () => {
    const { sendClosingReminders } = require('../jobs/eventAutoClose');

    test('Notifies participants for events closing within 48h, once only', async () => {
      const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const event = await IdeathonEvent.create({
        eventName: `${EVENT_NAME_PREFIX} Closing Soon`, eventType: EVENT_TYPE.IDEATHON,
        startDate: new Date(Date.now() - 60 * 60 * 1000), endDate: soon,
        visibility: EVENT_VISIBILITY.PUBLISHED, status: EVENT_STATUS.ACTIVE,
        participants: [opsUser._id], createdBy: adminUser._id,
      });

      await sendClosingReminders();

      const notif = await waitFor(() => Notification.findOne({
        recipientId: opsUser._id,
        triggerEvent: 'ideathon_closing_48h',
        link: `/events/${event._id}`,
      }).lean());
      expect(notif).not.toBeNull();

      const refreshed = await IdeathonEvent.findById(event._id).lean();
      expect(refreshed.closingReminderSent).toBe(true);

      // Second run must not double-notify.
      const before = await Notification.countDocuments({ triggerEvent: 'ideathon_closing_48h', link: `/events/${event._id}` });
      await sendClosingReminders();
      const after = await Notification.countDocuments({ triggerEvent: 'ideathon_closing_48h', link: `/events/${event._id}` });
      expect(after).toBe(before);
    });

    test('Does not notify for events closing beyond 48h', async () => {
      const later = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const event = await IdeathonEvent.create({
        eventName: `${EVENT_NAME_PREFIX} Closing Later`, eventType: EVENT_TYPE.IDEATHON,
        startDate: new Date(), endDate: later,
        visibility: EVENT_VISIBILITY.PUBLISHED, status: EVENT_STATUS.ACTIVE,
        participants: [opsUser._id], createdBy: adminUser._id,
      });

      await sendClosingReminders();

      const notif = await Notification.findOne({
        triggerEvent: 'ideathon_closing_48h',
        link: `/events/${event._id}`,
      }).lean();
      expect(notif).toBeNull();
    });

    test('Extension resets the reminder flag for the new deadline', async () => {
      const event = await IdeathonEvent.create({
        eventName: `${EVENT_NAME_PREFIX} Remind Then Extend`, eventType: EVENT_TYPE.IDEATHON,
        startDate: new Date(Date.now() - 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        visibility: EVENT_VISIBILITY.PUBLISHED, status: EVENT_STATUS.ACTIVE,
        participants: [opsUser._id], createdBy: adminUser._id,
      });

      await sendClosingReminders();
      expect((await IdeathonEvent.findById(event._id).lean()).closingReminderSent).toBe(true);

      await request(app)
        .post(`/api/events/${event._id}/extend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newEndDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), justification: 'Extending so a fresh reminder is warranted.' })
        .expect(200);

      expect((await IdeathonEvent.findById(event._id).lean()).closingReminderSent).toBe(false);
    });
  });
});
