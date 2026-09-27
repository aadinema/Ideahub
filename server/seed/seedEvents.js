/**
 * server/seed/seedEvents.js
 * Seeds demo Ideathon events (FR-IE) so the admin event console and the
 * employee Explore / My Events / leaderboard views have real data.
 *
 * Idempotent — matched by eventName.
 * Usage: node seed/seedEvents.js   (loads .env)  or via node seed/index.js
 */
require('dotenv').config();

const IdeathonEvent = require('../models/IdeathonEvent');
const Idea = require('../models/Idea');
const User = require('../models/User');
const logger = require('../utils/logger');
const { EVENT_TYPE, EVENT_VISIBILITY, EVENT_STATUS } = require('../../shared/constants');

const d = (month, day, h = 9) => new Date(2026, month - 1, day, h, 0);

// Ideas linked to the flagship event so the leaderboard has real evaluations.
const LINKED_IDEA_TITLES = [
  'ML-based ticket routing for the helpdesk',
  'Learning-path recommendations engine',
  'Self-healing restart for stateless services',
  'Zero-trust network access rollout',
  'Predictive maintenance schedule for packaging line',
];

const seedEvents = async () => {
  const [priya, rajesh, neha, admin] = await Promise.all([
    User.findOne({ email: 'employee@ideahub.local' }).lean(),
    User.findOne({ email: 'supervisor@ideahub.local' }).lean(),
    User.findOne({ email: 'impl.owner@ideahub.local' }).lean(),
    User.findOne({ email: 'admin@ideahub.local' }).lean(),
  ]);
  if (!admin) {
    logger.warn('seedEvents: admin user missing — run seedUsers first.');
    return;
  }

  const defs = [
    {
      eventName: 'AI for Operations Ideathon 2026',
      theme: 'Applied AI for frontline operations',
      description:
        'A company-wide ideathon to surface practical AI and automation ideas that reduce manual effort across operations, IT and support functions.',
      eventType: EVENT_TYPE.IDEATHON,
      initiative: 'Digital Transformation',
      startDate: d(9, 15),
      endDate: d(10, 15),
      targetDepartments: [],
      maxParticipants: 100,
      ideaCategory: 'Process Improvement',
      visibility: EVENT_VISIBILITY.PUBLISHED,
      status: EVENT_STATUS.ACTIVE,
      minQualifyingScore: 6,
      participants: [priya?._id, rajesh?._id, neha?._id].filter(Boolean),
    },
    {
      eventName: 'IT Automation Challenge',
      theme: 'Automating engineering operations',
      description:
        'Restricted challenge for the IT department to eliminate toil in build, deploy, monitoring and access-management workflows.',
      eventType: EVENT_TYPE.IDEATHON,
      initiative: 'Operational Excellence',
      startDate: d(9, 10),
      endDate: d(10, 10),
      targetDepartments: ['IT'],
      maxParticipants: 20,
      ideaCategory: 'Technology',
      visibility: EVENT_VISIBILITY.RESTRICTED,
      status: EVENT_STATUS.ACTIVE,
      minQualifyingScore: 6.5,
      participants: [neha?._id].filter(Boolean),
    },
    {
      eventName: 'Q4 Continuous Improvement Drive',
      theme: 'Every team, one improvement',
      description:
        'Draft campaign inviting each department to propose one measurable process improvement for the final quarter.',
      eventType: EVENT_TYPE.IDEATHON,
      initiative: 'Operational Excellence',
      startDate: d(10, 1),
      endDate: d(11, 15),
      targetDepartments: [],
      maxParticipants: null,
      ideaCategory: 'Process Improvement',
      visibility: EVENT_VISIBILITY.DRAFT,
      status: EVENT_STATUS.DRAFT,
      minQualifyingScore: 6,
      participants: [],
    },
  ];

  let created = 0;
  const byName = {};
  for (const def of defs) {
    let event = await IdeathonEvent.findOne({ eventName: def.eventName });
    if (!event) {
      event = await IdeathonEvent.create({ ...def, createdBy: admin._id });
      created++;
      logger.info(`  Created event: ${event.eventName} (${event.status}/${event.visibility})`);
    }
    byName[def.eventName] = event;
  }

  // Link a set of ideas to the flagship event (FR-02-07) so the leaderboard
  // has evaluated entries.
  const flagship = byName['AI for Operations Ideathon 2026'];
  let linked = 0;
  if (flagship) {
    const res = await Idea.updateMany(
      { title: { $in: LINKED_IDEA_TITLES } },
      { $set: { linkedEventId: flagship._id } }
    );
    linked = res.modifiedCount;
  }

  logger.info(`Events seeded: ${created} created. Ideas linked to flagship event: ${linked}.`);
};

// Standalone runner
if (require.main === module) {
  const connectDB = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await seedEvents();
      logger.info('✅ Event seed complete.');
      process.exit(0);
    } catch (err) {
      logger.error('Event seed failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = seedEvents;
