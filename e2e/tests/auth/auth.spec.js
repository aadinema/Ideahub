import { expect } from '@playwright/test';
import { test, SEED_USERS } from '../fixtures/auth.fixture';

test.describe('Authentication Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Valid Login - Employee', async ({ page }) => {
    await page.fill('input[type="email"]', SEED_USERS.employee.email);
    await page.fill('input[type="password"]', SEED_USERS.employee.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    // Check for correct role UI elements or dashboard text
    await expect(page.locator('p:has-text("Innovation Dashboard")').first()).toBeVisible();
    // Ensure logout button exists
    await expect(page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out")').first()).toBeVisible();
  });

  test('Valid Login - Admin', async ({ page }) => {
    await page.fill('input[type="email"]', SEED_USERS.admin.email);
    await page.fill('input[type="password"]', SEED_USERS.admin.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('p:has-text("Innovation Dashboard")').first()).toBeVisible();
  });

  test('Invalid Login - Wrong Password', async ({ page }) => {
    await page.fill('input[type="email"]', SEED_USERS.employee.email);
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.text-red-500, .alert-danger, [role="alert"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('Invalid Login - Empty Fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Should not submit and HTML5 validation or custom validation should show
    await expect(page).toHaveURL('/login');
  });

  test('Session - Logout', async ({ employeePage }) => {
    // employeePage fixture automatically logs in
    const page = employeePage;
    await page.goto('/dashboard');
    
    // Find logout button and click it
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out")').first();
    await logoutBtn.click();

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('Unauthorized Access - Protected Route without Login', async ({ page }) => {
    // Attempt to access a protected route directly
    await page.goto('/ideas/new');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
