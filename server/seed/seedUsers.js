/**
 * server/seed/seedUsers.js
 * Seeds one demo user per role for development and testing.
 * Creates an admin user first, then one user per remaining role.
 * All demo users use a default password defined in .env (SEED_DEFAULT_PASSWORD).
 *
 * Safe to run multiple times (upsert by employeeId).
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');
const { ROLES } = require('../../shared/constants');

const DEMO_USERS = [
  {
    employeeId: 'EMP-ADMIN-001',
    name: 'Admin User',
    email: 'admin@ideahub.local',
    department: 'IT',
    designation: 'System Administrator',
    grade: 'G1',
    roles: [ROLES.ADMIN],
  },
  {
    employeeId: 'EMP-EMP-001',
    name: 'Priya Sharma',
    email: 'employee@ideahub.local',
    department: 'Operations',
    designation: 'Associate',
    grade: 'G5',
    roles: [ROLES.EMPLOYEE],
  },
  {
    employeeId: 'EMP-SUP-001',
    name: 'Rajesh Kumar',
    email: 'supervisor@ideahub.local',
    department: 'Operations',
    designation: 'Team Lead',
    grade: 'G3',
    roles: [ROLES.SUPERVISOR, ROLES.EMPLOYEE],
  },
  {
    employeeId: 'EMP-DEPT-001',
    name: 'Anita Desai',
    email: 'dept.team@ideahub.local',
    department: 'Operations',
    designation: 'Department Innovation Lead',
    grade: 'G2',
    roles: [ROLES.DEPT_INNOVATION_TEAM, ROLES.SUPERVISOR, ROLES.EMPLOYEE],
  },
  {
    employeeId: 'EMP-DEPT-002',
    name: 'Suresh Menon',
    email: 'dept.team2@ideahub.local',
    department: 'Operations',
    designation: 'Senior Innovation Analyst',
    grade: 'G3',
    roles: [ROLES.DEPT_INNOVATION_TEAM, ROLES.EMPLOYEE],
  },
  {
    employeeId: 'EMP-COMM-001',
    name: 'Vikram Singh',
    email: 'committee@ideahub.local',
    department: 'Strategy',
    designation: 'Innovation Committee Member',
    grade: 'G1',
    roles: [ROLES.INNOVATION_COMMITTEE, ROLES.EMPLOYEE],
  },
  {
    employeeId: 'EMP-IMPL-001',
    name: 'Neha Patel',
    email: 'impl.owner@ideahub.local',
    department: 'IT',
    designation: 'Project Manager',
    grade: 'G3',
    roles: [ROLES.IMPLEMENTATION_OWNER, ROLES.EMPLOYEE],
  },
];

const seed = async () => {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'IdeaHub@Dev2026!';
  logger.info(`Seeding demo users (password: ${defaultPassword})...`);
  let created = 0;
  let skipped = 0;
  const userDocs = [];

  for (const userData of DEMO_USERS) {
    const existing = await User.findOne({ employeeId: userData.employeeId });
    if (existing) {
      userDocs.push(existing);
      skipped++;
      continue;
    }

    const user = await User.create({ ...userData, password: defaultPassword });
    userDocs.push(user);
    created++;
    logger.info(`  Created: ${user.name} (${user.email}) — roles: ${user.roles.join(', ')}`);
  }

  // Wire up manager relationships (supervisor manages employee in demo)
  const supervisor = userDocs.find((u) => u.employeeId === 'EMP-SUP-001');
  const employee = userDocs.find((u) => u.employeeId === 'EMP-EMP-001');
  if (supervisor && employee && !employee.managerId) {
    await User.findByIdAndUpdate(employee._id, { managerId: supervisor._id });
    logger.info(`  Wired ${employee.name} → manager: ${supervisor.name}`);
  }

  logger.info(`Demo users seeded: ${created} created, ${skipped} already exist.`);
  return userDocs;
};

if (require.main === module) {
  require('dotenv').config({ path: '../.env' });
  const connectDB = require('../config/db');
  (async () => {
    await connectDB();
    await seed();
    process.exit(0);
  })();
}

module.exports = seed;
