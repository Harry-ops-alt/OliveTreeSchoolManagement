import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

const nonZeroPattern = /^(?!0+(?:\.0+)?$)/;

test.describe('dashboard data', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
  });

  test('surfaces seeded metrics, finance, and attendance data', async ({ page }) => {
    await expect(page).toHaveURL(/\/app/);

    await expect(page.getByTestId('metric-students')).toHaveText(nonZeroPattern);
    await expect(page.getByTestId('metric-teachers')).toHaveText(nonZeroPattern);
    await expect(page.getByTestId('metric-open-admissions')).toHaveText(nonZeroPattern);
    await expect(page.getByTestId('metric-net-revenue')).not.toHaveText(/^£?0+(?:\.0+)?$/i);

    const admissionsItems = page.getByTestId('admissions-item');
    await expect(admissionsItems.first()).toBeVisible();

    const financeItems = page.getByTestId('finance-item');
    await expect(financeItems.first()).toBeVisible();
    await expect(financeItems.first()).toContainText('£');

    const attendanceItems = page.getByTestId('attendance-item');
    if (await attendanceItems.count()) {
      await expect(attendanceItems.first()).toBeVisible();
      const presentBadge = page.getByTestId('attendance-status-present').first();
      await expect(presentBadge).toBeVisible();
      await expect(presentBadge).toContainText('present');
    } else {
      const attendanceFallback = page.getByText(/attendance sessions will appear/i);
      await expect(attendanceFallback).toBeVisible();
    }
  });
});
