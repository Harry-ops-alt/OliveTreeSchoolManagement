import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

test.describe('finance page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/app/finance');
  });

  test('shows seeded finance transactions', async ({ page }) => {
    await expect(page).toHaveURL(/\/app\/finance/);

    const financeItems = page.getByTestId('finance-detail-item');
    await expect(financeItems.first()).toBeVisible();
    await expect(financeItems.first()).toContainText(/invoice|payment|expense/i);
    await expect(financeItems.first()).toContainText(/£|\d/);
  });
});
