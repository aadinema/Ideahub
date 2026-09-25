/**
 * server/seed/seedCategories.js
 * Seeds initial idea categories, subcategories, and event initiative master data.
 * Admin can add/edit/deactivate via Admin → Category Management (FR-AD-04).
 */
const Category = require('../models/Category');
const logger = require('../utils/logger');
const { CATEGORY_TYPE } = require('../../shared/constants');

const CATEGORIES = [
  // Top-level idea categories
  { name: 'Technology & Innovation', type: CATEGORY_TYPE.CATEGORY },
  { name: 'Process Improvement', type: CATEGORY_TYPE.CATEGORY },
  { name: 'Cost Optimization', type: CATEGORY_TYPE.CATEGORY },
  { name: 'Customer Experience', type: CATEGORY_TYPE.CATEGORY },
  { name: 'Employee Experience', type: CATEGORY_TYPE.CATEGORY },
  { name: 'Compliance & Risk', type: CATEGORY_TYPE.CATEGORY },
  { name: 'Business Development', type: CATEGORY_TYPE.CATEGORY },
  // Initiatives
  { name: 'Digital Transformation', type: CATEGORY_TYPE.INITIATIVE },
  { name: 'Operational Excellence', type: CATEGORY_TYPE.INITIATIVE },
  { name: 'Customer First', type: CATEGORY_TYPE.INITIATIVE },
  { name: 'Green & Sustainability', type: CATEGORY_TYPE.INITIATIVE },
  { name: 'Talent & Culture', type: CATEGORY_TYPE.INITIATIVE },
];

const seed = async (adminUserId) => {
  logger.info('Seeding categories and initiatives...');
  let created = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ name: cat.name, type: cat.type, parentId: null });
    if (existing) { skipped++; continue; }
    await Category.create({ ...cat, parentId: null, isActive: true, createdBy: adminUserId });
    created++;
  }

  logger.info(`Categories seeded: ${created} created, ${skipped} already exist.`);
};

if (require.main === module) {
  require('dotenv').config({ path: '../.env' });
  const connectDB = require('../config/db');
  const User = require('../models/User');
  (async () => {
    await connectDB();
    const admin = await User.findOne({ roles: 'admin' });
    await seed(admin._id);
    process.exit(0);
  })();
}

module.exports = seed;
