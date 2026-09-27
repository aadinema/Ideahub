/**
 * server/jest.setup.js
 * Runs before each test file loads the app (Jest `setupFiles`).
 *
 * Rewrites MONGODB_URI to an isolated `ideahub_test` database on the same
 * cluster. Several suites perform destructive cleanup in afterAll hooks
 * (e.g. User.deleteMany({}) / Idea.deleteMany({})) — without this override
 * those would wipe the shared development database. Tests must never touch
 * dev data.
 */
require('dotenv').config();

if (process.env.MONGODB_URI) {
  const [base, query] = process.env.MONGODB_URI.split('?');
  const isolated = base.replace(/\/[A-Za-z0-9_-]+$/, '/ideahub_test');
  process.env.MONGODB_URI = query ? `${isolated}?${query}` : isolated;
}
