import { test, expect, SEED_USERS } from '../fixtures/auth.fixture';
import mongoose from 'mongoose';

import dotenv from 'dotenv';
import path from 'path';

// Load the server .env file so we connect to the correct MongoDB Atlas cluster
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });

// Ensure Mongoose connects to the test database
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

async function login(page, credentials) {
  await page.goto('/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.waitForSelector('p:has-text("Innovation Dashboard")');
}

test.describe('Innovation Committee Review Workflow (FR-05)', () => {
  let testIdeaId = null;

  test.beforeAll(async () => {
    await connectDB();
    
    // We get the committee user to set as the submitter or just use a dummy
    const employee = await mongoose.connection.collection('users').findOne({ email: SEED_USERS.employee.email });
    
    const ideaTitle = `Committee Review Idea ${Date.now()}`;
    const newIdea = {
      title: ideaTitle,
      ideaId: `IDEA-TEST-${Date.now().toString().slice(-6)}`,
      category: 'Technology & Innovation',
      department: 'Operations',
      problemStatement: 'This is a highly impactful idea that requires implementation and testing. We need a long enough text to pass validation.',
      benefitTypes: ['cost_reduction'],
      status: 'under_committee_review', // Directly place it in the committee queue
      submittedBy: employee._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory: []
    };
    
    const result = await mongoose.connection.collection('ideas').insertOne(newIdea);
    testIdeaId = result.insertedId;
  });

  test.afterAll(async () => {
    if (testIdeaId) {
      await mongoose.connection.collection('ideas').deleteOne({ _id: testIdeaId });
    }
  });

  test('Committee can approve an idea for implementation', async ({ browser }) => {
    const committeeContext = await browser.newContext();
    const committeePage = await committeeContext.newPage();
    
    await login(committeePage, SEED_USERS.committee);
    
    // 1. Committee views the queue
    await committeePage.goto('/committee/queue');
    const row = committeePage.locator('div.glass').filter({ hasText: 'Committee Review Idea' }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    
    // 2. Click Open 360° View
    await row.locator('a:has-text("Open 360° View")').click();
    await committeePage.waitForURL(/\/committee\/ideas\/[a-f0-9]+/);
    
    // 3. Select Implementation Owner and Approve
    await committeePage.click('button:has-text("Implement")');
    await committeePage.waitForSelector('#impl-owner');
    
    // Select the first available owner (the seed user Neha Patel should be there)
    const selectLocator = committeePage.locator('#impl-owner');
    // Find the option value that is not empty
    await selectLocator.selectOption({ index: 1 });
    
    await committeePage.fill('#committee-comment', 'Approved for immediate implementation.');
    
    const implementResponsePromise = committeePage.waitForResponse(r => r.url().includes('/approve-implementation') && r.request().method() === 'POST');
    await committeePage.click('button:has-text("Confirm Decision")');
    const implementResponse = await implementResponsePromise;
    const body = await implementResponse.json();
    console.log('IMPLEMENT APPROVAL RESPONSE:', implementResponse.status(), body);
    expect(implementResponse.status()).toBe(200);
    
    // 4. Verify we are back on the queue and the idea is gone
    await committeePage.waitForURL('/committee/queue');
    await expect(committeePage.locator('div.glass').filter({ hasText: 'Committee Review Idea' })).toBeHidden();
  });
});
