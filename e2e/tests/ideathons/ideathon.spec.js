import { test, expect, SEED_USERS } from '../fixtures/auth.fixture';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load the server .env file so we connect to the correct MongoDB Atlas cluster
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

test.describe('Ideathon Event Management & Gallery (FR-IE, FR-06)', () => {
  let testEventId = null;

  test.beforeAll(async () => {
    await connectDB();
    const admin = await mongoose.connection.collection('users').findOne({ email: SEED_USERS.admin.email });
    
    // Create an active Ideathon event
    const event = {
      eventName: `Test Ideathon ${Date.now()}`,
      theme: 'Testing Innovation',
      description: 'A test ideathon to verify the workflow.',
      eventType: 'ideathon',
      initiative: 'digital_transformation',
      startDate: new Date(Date.now() - 86400000), // Yesterday
      endDate: new Date(Date.now() + 86400000 * 7), // Next week
      targetDepartments: [],
      maxParticipants: 50,
      ideaCategory: 'Technology & Innovation',
      visibility: 'published',
      minQualifyingScore: 5,
      quorumType: 'majority',
      quorumValue: 2,
      status: 'active',
      participants: [],
      createdBy: admin._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await mongoose.connection.collection('ideathonevents').insertOne(event);
    testEventId = result.insertedId;
  });

  test.afterAll(async () => {
    if (testEventId) {
      await mongoose.connection.collection('ideathonevents').deleteOne({ _id: testEventId });
    }
  });

  test('Employee can explore, join an Ideathon, and submit an idea', async ({ browser }) => {
    const empContext = await browser.newContext();
    const employeePage = await empContext.newPage();
    
    // 1. Employee logs in
    await employeePage.goto('/login');
    await employeePage.fill('input[type="email"]', SEED_USERS.employee.email);
    await employeePage.fill('input[type="password"]', SEED_USERS.employee.password);
    await employeePage.click('button[type="submit"]');
    await employeePage.waitForURL('/dashboard');
    
    // 2. Go to Events page
    await employeePage.goto('/events');
    
    // Wait for the event card to appear
    const eventCard = employeePage.locator('.glass').filter({ hasText: 'A test ideathon to verify the workflow.' }).first();
    await expect(eventCard).toBeVisible({ timeout: 15000 });
    
    // 3. View Event Details
    await eventCard.locator('button:has-text("Details")').click();
    await employeePage.waitForURL(/\/events\/[a-f0-9]+/);
    
    // 4. Join the Event
    const joinResponsePromise = employeePage.waitForResponse(r => r.url().includes('/join') && r.request().method() === 'POST');
    await employeePage.click('button:has-text("Join Event")');
    const joinResponse = await joinResponsePromise;
    console.log('JOIN API RESPONSE:', joinResponse.status(), await joinResponse.json());
    expect(joinResponse.status()).toBe(200);
    
    // Wait for button to change to "Submit an Idea"
    const submitBtn = employeePage.locator('a:has-text("Submit an Idea")');
    await expect(submitBtn).toBeVisible();
    
    // 5. Submit an idea for this event
    await submitBtn.click();
    await employeePage.waitForURL(/\/ideas\/new\?eventId=[a-f0-9]+/);

    // Submit the form
    await employeePage.fill('#idea-title', `Ideathon Idea ${Date.now()}`);
    await employeePage.fill('#idea-category', 'Technology & Innovation');
    await employeePage.fill('#idea-dept', 'Operations');
    
    await employeePage.click('#btn-next-section');
    await employeePage.locator('#idea-problemStatement .ql-editor').fill('Solving a problem for the hackathon event. We need to write at least fifty characters to pass the validation check.');
    
    await employeePage.click('#btn-next-section');
    await employeePage.locator('label:has-text("Cost Reduction")').click();
    
    // Skip to Ideathon tab to verify
    await employeePage.locator('button[role="tab"]:has-text("Ideathon")').click();
    await expect(employeePage.locator('select#idea-event')).toHaveValue(testEventId.toString());

    await employeePage.click('#btn-submit-idea-form');
    await employeePage.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/ideas');
  });
});
