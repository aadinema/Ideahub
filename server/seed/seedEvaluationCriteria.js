/**
 * server/seed/seedEvaluationCriteria.js
 * Seeds the default 9 evaluation criteria from FRD §8.1.
 * Weights are stored as decimals (e.g., 0.15 = 15%).
 * Sum = 1.00 (100%). Validated on Admin edits.
 *
 * This seed is safe to run multiple times (upsert by criterionName + null eventId).
 */
const mongoose = require('mongoose');
const EvaluationCriteria = require('../models/EvaluationCriteria');
const User = require('../models/User');
const logger = require('../utils/logger');

const DEFAULT_CRITERIA = [
  // FRD §8.1 — exact names, weights, and guidance
  {
    criterionName: 'Innovation Score',
    weight: 0.15,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Degree of novelty and originality. 10 = highly novel breakthrough; 1 = minor variation on existing practice.',
  },
  {
    criterionName: 'Feasibility',
    weight: 0.15,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Technical and operational practicality. 10 = can be implemented with current resources; 1 = requires significant capability/infrastructure changes.',
  },
  {
    criterionName: 'Strategic Alignment',
    weight: 0.20,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Alignment with organizational strategy and priorities. 10 = directly advances a current strategic goal; 1 = tangential or unclear alignment.',
  },
  {
    criterionName: 'Business Impact',
    weight: 0.15,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Potential magnitude of positive impact on business outcomes. 10 = transformational; 1 = negligible.',
  },
  {
    criterionName: 'Cost Saving Potential',
    weight: 0.10,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Estimated financial benefit through cost reduction. 10 = significant quantifiable savings; 1 = minimal or unquantifiable.',
  },
  {
    criterionName: 'Revenue Opportunity',
    weight: 0.10,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Potential to generate new or incremental revenue. 10 = clear revenue pathway identified; 1 = no revenue link.',
  },
  {
    criterionName: 'Customer Benefit',
    weight: 0.05,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Enhancement to customer experience or satisfaction. 10 = directly and measurably improves customer experience; 1 = no customer impact.',
  },
  {
    criterionName: 'Implementation Complexity',
    weight: 0.05,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Ease of implementation. 10 = very simple, low effort; 1 = highly complex, requires extensive planning and resources.',
  },
  {
    criterionName: 'Risk Assessment',
    weight: 0.05,
    scoreRangeMin: 1,
    scoreRangeMax: 10,
    guidance: 'Risk level of implementation. 10 = low risk, well-understood; 1 = high risk, significant uncertainty or regulatory exposure.',
  },
];

// Validate total = 100% before seeding
const totalWeight = DEFAULT_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.0001) {
  throw new Error(
    `Evaluation criteria weights do not sum to 100%. Got ${(totalWeight * 100).toFixed(2)}%. Fix the seed file.`
  );
}

const seed = async (adminUserId) => {
  logger.info('Seeding default evaluation criteria...');
  let created = 0;
  let skipped = 0;

  for (const criterion of DEFAULT_CRITERIA) {
    const existing = await EvaluationCriteria.findOne({
      criterionName: criterion.criterionName,
      ideathonEventId: null,
    });

    if (existing) {
      skipped++;
      continue;
    }

    await EvaluationCriteria.create({
      ...criterion,
      ideathonEventId: null, // global default
      isActive: true,
      version: 1,
      effectiveFrom: new Date(),
      createdBy: adminUserId,
    });
    created++;
  }

  logger.info(`Evaluation criteria seeded: ${created} created, ${skipped} already exist.`);
};

// Allow standalone execution: node server/seed/seedEvaluationCriteria.js
if (require.main === module) {
  require('dotenv').config({ path: '../.env' });
  const connectDB = require('../config/db');

  (async () => {
    await connectDB();
    const admin = await User.findOne({ roles: 'admin' });
    if (!admin) {
      logger.error('No admin user found. Run seedUsers first.');
      process.exit(1);
    }
    await seed(admin._id);
    process.exit(0);
  })();
}

module.exports = seed;
