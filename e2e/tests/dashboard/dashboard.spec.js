import { expect } from '@playwright/test';
import { test, SEED_USERS } from '../fixtures/auth.fixture';

test.describe('Dashboard Module (FR-01)', () => {

  test('KPIs Display', async ({ employeePage }) => {
    const page = employeePage;
    await page.goto('/dashboard');

    // Check if KPI cards are visible (they usually have numbers and labels like "Ideas Received")
    await expect(page.locator('text=Ideas Received').first()).toBeVisible();
    await expect(page.locator('text=Ideathons').first()).toBeVisible();
    // Some KPIs might be admin/manager specific, but these should be generally visible or at least have a container
  });

  test('Featured Ideas Display', async ({ employeePage }) => {
    const page = employeePage;
    await page.goto('/dashboard');

    // Verify featured ideas section exists
    await expect(page.locator('h2:has-text("Featured Ideas"), h3:has-text("Featured Ideas")').first()).toBeVisible();
  });

  test('Quick Action Buttons', async ({ employeePage }) => {
    const page = employeePage;
    await page.goto('/dashboard');

    // Check for Submit Idea button
    const submitBtn = page.locator('a:has-text("Submit Idea"), button:has-text("Submit Idea")').first();
    await expect(submitBtn).toBeVisible();

    // Check for View My Ideas button
    const myIdeasBtn = page.locator('a:has-text("My Ideas"), button:has-text("My Ideas")').first();
    await expect(myIdeasBtn).toBeVisible();
  });

  test('Role-based visibility: Admin Dashboard', async ({ adminPage }) => {
    const admin = adminPage;
    await admin.goto('/dashboard');
    
    // Check for Admin panel link
    await expect(admin.locator('a[href*="admin"], a:has-text("Admin")').first()).toBeVisible();
  });

  test('Role-based visibility: Employee Dashboard', async ({ employeePage }) => {
    const employee = employeePage;
    await employee.goto('/dashboard');
    
    // Employee should NOT see Admin panel link
    await expect(employee.locator('a[href*="admin"], a:has-text("Admin")').first()).toBeHidden();
  });
});
