/**
 * server/seed/index.js
 * Master seed runner — runs all seeds in dependency order.
 * Usage: node server/seed/index.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const seedUsers = require('./seedUsers');
const seedEvaluationCriteria = require('./seedEvaluationCriteria');
const seedCategories = require('./seedCategories');
const seedIdeas = require('./seedIdeas');
const seedCeoDemoIdeas = require('./seedCeoDemoIdeas');
const seedEvents = require('./seedEvents');
const SystemConfig = require('../models/SystemConfig');
const logger = require('../utils/logger');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();

    // 1. Users first (criteria/categories need an admin userId)
    const users = await seedUsers();

    // 2. Ensure SystemConfig singleton exists
    await SystemConfig.getSingleton();
    logger.info('SystemConfig singleton ensured.');

    // 3. Evaluation criteria (needs admin user)
    const admin = await User.findOne({ roles: 'admin' });
    await seedEvaluationCriteria(admin._id);

    // 4. Categories and initiatives
    await seedCategories(admin._id);

    // 5. Seed realistic Ideas
    await seedIdeas();

    // 6. Richer cross-workflow dataset for the CEO dashboard (CEO-01, idempotent)
    await seedCeoDemoIdeas();

    // 7. Ideathon events + event-linked ideas (FR-IE, idempotent)
    await seedEvents();

    logger.info('✅ All seeds completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  }
})();
