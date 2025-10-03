import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

test.describe('admissions page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/app/admissions');
  });

  test('shows seeded admissions', async ({ page }) => {
    await expect(page).toHaveURL(/\/app\/admissions/);

    const admissionsItems = page.getByTestId('admissions-detail-item');
    await expect(admissionsItems.first()).toBeVisible();
    await expect(admissionsItems.first()).toContainText(/amara|yusuf/i);
  });
});
