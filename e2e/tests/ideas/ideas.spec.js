import { expect } from '@playwright/test';
import { test, SEED_USERS } from '../fixtures/auth.fixture';

test.describe('Idea Submission & Management (FR-02)', () => {
  test('Valid Idea Submission (Employee)', async ({ employeePage }) => {
    const page = employeePage;
    await page.goto('/dashboard');
    
    // Click submit idea button from dashboard
    await page.click('#btn-submit-idea-dashboard');
    await expect(page).toHaveURL('/ideas/new');

    // Section 1: Basic Info
    await page.fill('#idea-title', 'Automated Database Backup System for Critical Data');
    await page.fill('#idea-category', 'Technology & Innovation');
    await page.fill('#idea-dept', 'Information Technology');
    
    // Go to next section
    await page.click('#btn-next-section');

    // Section 2: Description
    // RichTextEditor uses ReactQuill, so we can fill the contenteditable div
    const problemEditor = page.locator('#idea-problemStatement .ql-editor');
    await problemEditor.fill('Currently, our database backups are performed manually which is prone to human error and takes a significant amount of time every single day. This is a huge risk.');
    
    // Go to next section
    await page.click('#btn-next-section');

    // Section 3: Benefits
    // Click the first benefit checkbox
    await page.locator('label:has-text("Cost Reduction")').click();

    // Submit form
    await page.click('#btn-submit-idea-form');

    // Should see success message
    await expect(page.locator('h2:has-text("Idea Submitted!")')).toBeVisible();

    // Should redirect to /ideas
    await expect(page).toHaveURL('/ideas');
    
    // Verify idea is in the list
    await expect(page.locator('h2:has-text("Automated Database Backup System for Critical Data")').first()).toBeVisible();
  });

  test('Invalid Submission - Missing Required Fields', async ({ employeePage }) => {
    const page = employeePage;
    await page.goto('/ideas/new');

    // Try submitting without filling anything
    await page.click('#btn-submit-idea-form');

    // Should stay on Section 1 and show error messages
    await expect(page.locator('#err-title')).toBeVisible();
    
    // Fill title but omit category/dept
    await page.fill('#idea-title', 'My new great idea');
    await page.click('#btn-submit-idea-form');
    await expect(page.locator('p[role="alert"]:has-text("Category is required")')).toBeVisible();
  });

  test.fail('Draft Auto-Save (New Idea) - Application Defect', async ({ employeePage }) => {
    // This test is expected to fail because the backend Idea.create() enforces 
    // Mongoose validation (e.g., problemStatement minlength) even for new drafts,
    // causing a 400/500 error before the draft is saved.
    const page = employeePage;
    await page.goto('/ideas/new');

    // Fill title
    await page.fill('#idea-title', 'This is a draft idea that I will save manually');
    
    // Click save draft
    await page.click('#btn-manual-save');
    
    // Wait a bit for the auto-save mutation to complete
    await page.waitForTimeout(2000);
    
    // Should see "Auto-saved" text (this will timeout because the API fails)
    await expect(page.locator('text=Auto-saved')).toBeVisible({ timeout: 10000 });
  });

  test('Draft Auto-Save (Existing Draft)', async ({ employeePage }) => {
    const page = employeePage;
    // First, submit a valid draft by filling required fields to bypass the creation bug
    await page.goto('/ideas/new');
    await page.fill('#idea-title', 'My Existing Draft Idea');
    await page.fill('#idea-category', 'Technology & Innovation');
    await page.fill('#idea-dept', 'Information Technology');
    await page.click('#btn-next-section');
    await page.locator('#idea-problemStatement .ql-editor').fill('Currently, our database backups are performed manually which is prone to human error and takes a significant amount of time every single day. This is a huge risk.');
    await page.click('#btn-next-section');
    await page.locator('label:has-text("Cost Reduction")').click();
    
    // Now that the form has enough data, click save
    await page.click('#btn-manual-save');
    
    // It should successfully auto-save and create the draft ID
    await expect(page.locator('text=Auto-saved')).toBeVisible({ timeout: 10000 });

    // Now edit it to trigger a PATCH update (which works properly)
    await page.click('#tab-basic');
    await page.fill('#idea-title', 'My Updated Draft Idea');
    await page.click('#btn-manual-save');
    
    // Wait for the new auto-save to complete
    await page.waitForTimeout(2000);
    
    // Verify draft is in the list
    await page.goto('/ideas');
    await expect(page.locator('h2:has-text("My Updated Draft Idea")').first()).toBeVisible();
    await expect(page.locator('text=Draft').first()).toBeVisible();
  });
});
