import { test as base } from '@playwright/test';

// Define the seeded users from server/seed/seedUsers.js
export const SEED_USERS = {
  admin: {
    email: 'admin@ideahub.local',
    password: 'IdeaHub@Dev2026!', // Seed default password
  },
  employee: {
    email: 'employee@ideahub.local',
    password: 'IdeaHub@Dev2026!',
  },
  supervisor: {
    email: 'supervisor@ideahub.local',
    password: 'IdeaHub@Dev2026!',
  },
  dept_team: {
    email: 'dept.team@ideahub.local',
    password: 'IdeaHub@Dev2026!',
  },
  committee: {
    email: 'committee@ideahub.local',
    password: 'IdeaHub@Dev2026!',
  },
  impl_owner: {
    email: 'impl.owner@ideahub.local',
    password: 'IdeaHub@Dev2026!',
  },
};

// Create a fixture that logs in automatically
export const test = base.extend({
  // Override page to not be logged in by default, unless specified
  page: async ({ page }, use) => {
    await use(page);
  },

  // Fixtures for logged in users
  adminPage: async ({ page }, use) => {
    await login(page, SEED_USERS.admin);
    await use(page);
  },
  employeePage: async ({ page }, use) => {
    await login(page, SEED_USERS.employee);
    await use(page);
  },
  supervisorPage: async ({ page }, use) => {
    await login(page, SEED_USERS.supervisor);
    await use(page);
  },
  deptTeamPage: async ({ page }, use) => {
    await login(page, SEED_USERS.dept_team);
    await use(page);
  },
  committeePage: async ({ page }, use) => {
    await login(page, SEED_USERS.committee);
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Helper to login
async function login(page, credentials) {
  await page.goto('/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  // ensure we are on the dashboard
  await page.waitForSelector('p:has-text("Innovation Dashboard")');
}
