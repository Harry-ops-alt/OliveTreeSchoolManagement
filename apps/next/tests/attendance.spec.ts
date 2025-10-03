import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

test.describe('attendance session management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
  });

  test('updates notes on an attendance session', async ({ page }) => {
    await page.goto('/app/attendance/attendance-session-2025-10-06-am');

    await expect(page.getByRole('heading', { name: /attendance session/i })).toBeVisible();
    await expect(page.getByTestId('attendance-form')).toBeVisible();

    const firstRow = page.getByTestId('attendance-form-row').first();
    const notesField = firstRow.getByTestId('attendance-notes-textarea');

    await notesField.fill('Playwright note');

    await page.getByTestId('attendance-form-submit').last().click();

    await expect(page.getByTestId('attendance-form-success')).toBeVisible();
  });
});
