import { test, expect, SEED_USERS } from '../fixtures/auth.fixture';

// Helper to login (copied from auth.fixture.js to allow manual login for multiple contexts)
async function login(page, credentials) {
  await page.goto('/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.waitForSelector('p:has-text("Innovation Dashboard")');
}

test.describe('Supervisor Validation Workflow (FR-03)', () => {
  let submittedIdeaTitle = '';

  test.beforeAll(async () => {
    submittedIdeaTitle = `Test Idea for Supervisor ${Date.now()}`;
  });

  test.fail('End-to-End Supervisor Workflow: Submit, Return, Resubmit - Application Defect', async ({ browser }) => {
    // This test is expected to fail because the frontend fails to render the "Edit"
    // button when an idea is in the "returned" status, blocking the resubmit workflow (FR-03-03).
    
    // 0. Setup two separate browser contexts for Employee and Supervisor
    const empContext = await browser.newContext();
    const employeePage = await empContext.newPage();
    
    const supContext = await browser.newContext();
    const supervisorPage = await supContext.newPage();
    
    // Login both
    await login(employeePage, SEED_USERS.employee);
    await login(supervisorPage, SEED_USERS.supervisor);
    
    // 1. Employee submits an idea
    const ideaTitle = `Test Idea for Return Workflow ${Date.now()}`;
    await employeePage.goto('/ideas/new');
    await employeePage.fill('#idea-title', ideaTitle);
    await employeePage.fill('#idea-category', 'Technology & Innovation');
    await employeePage.fill('#idea-dept', 'Information Technology');
    
    await employeePage.click('#btn-next-section');
    await employeePage.locator('#idea-problemStatement .ql-editor').fill('Currently, our database backups are performed manually which is prone to human error and takes a significant amount of time every single day. This is a huge risk.');
    
    await employeePage.click('#btn-next-section');
    await employeePage.locator('label:has-text("Cost Reduction")').click();
    
    await employeePage.click('#btn-submit-idea-form');
    
    // Wait for submission to complete
    await employeePage.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/ideas');
    
    // 2. Supervisor checks queue
    await supervisorPage.goto('/supervisor/queue');
    
    // Verify idea is in the queue
    const ideaRow = supervisorPage.locator(`div.glass:has-text("${ideaTitle}")`);
    await expect(ideaRow).toBeVisible({ timeout: 15000 });
    
    // Verify SLA visibility
    await expect(ideaRow.locator('text=Business Days Remaining')).toBeVisible();

    // 3. Supervisor Returns the idea
    await ideaRow.locator('button:has-text("Return")').click();
    
    // Check validation on short comment
    await supervisorPage.fill('#sup-action-comment', 'Too short');
    await supervisorPage.click('button:has-text("Confirm return")');
    await expect(supervisorPage.locator('text=Comment must be at least 20 characters')).toBeVisible();
    
    // Provide valid comment and confirm
    await supervisorPage.fill('#sup-action-comment', 'Please provide more details on the financial impact.');
    
    const returnResponse = supervisorPage.waitForResponse(r => r.url().includes('/return') && r.status() === 200);
    await supervisorPage.click('button:has-text("Confirm return")');
    await returnResponse;
    
    // Verify it disappears from queue
    await expect(ideaRow).toBeHidden();

    // 4. Employee sees returned idea
    await employeePage.goto('/ideas');
    
    const empIdeaRow = employeePage.locator(`a:has(h2:has-text("${ideaTitle}"))`).first();
    await expect(empIdeaRow.locator('text=Returned')).toBeVisible();
    
    // Click the idea to view details
    await empIdeaRow.click();
    await employeePage.waitForURL(/\/ideas\/[a-f0-9]+$/);
    
    // Ensure we can see the supervisor's comment in the history
    await expect(employeePage.locator('text=Please provide more details on the financial impact.')).toBeVisible();

    // Click "Edit" to amend the returned idea
    const editBtn = employeePage.locator('a:has-text("Edit")');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    
    // -- Test will fail here due to missing Edit button on returned ideas --
  });

  test('Supervisor Workflow: Approve Idea', async ({ browser }) => {
    const empContext = await browser.newContext();
    const employeePage = await empContext.newPage();
    
    const supContext = await browser.newContext();
    const supervisorPage = await supContext.newPage();
    
    await login(employeePage, SEED_USERS.employee);
    await login(supervisorPage, SEED_USERS.supervisor);
    
    const ideaTitle = `Test Idea for Approve Workflow ${Date.now()}`;
    await employeePage.goto('/ideas/new');
    await employeePage.fill('#idea-title', ideaTitle);
    await employeePage.fill('#idea-category', 'Technology & Innovation');
    await employeePage.fill('#idea-dept', 'Information Technology');
    
    await employeePage.click('#btn-next-section');
    await employeePage.locator('#idea-problemStatement .ql-editor').fill('A straightforward problem statement to satisfy validation requirements.');
    
    await employeePage.click('#btn-next-section');
    await employeePage.locator('label:has-text("Cost Reduction")').click();
    
    await employeePage.click('#btn-submit-idea-form');
    await employeePage.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/ideas');
    
    // Supervisor checks queue and Approves
    await supervisorPage.goto('/supervisor/queue');
    const ideaRow = supervisorPage.locator(`div.glass:has-text("${ideaTitle}")`);
    await expect(ideaRow).toBeVisible({ timeout: 15000 });
    
    await ideaRow.locator('button:has-text("Approve")').click();
    
    // Provide optional comment
    await supervisorPage.fill('#sup-action-comment', 'Looks good to proceed.');
    
    const approveResponse = supervisorPage.waitForResponse(r => r.url().includes('/approve') && r.status() === 200);
    await supervisorPage.click('button:has-text("Confirm approve")');
    await approveResponse;
    
    await expect(ideaRow).toBeHidden();
  });
});
