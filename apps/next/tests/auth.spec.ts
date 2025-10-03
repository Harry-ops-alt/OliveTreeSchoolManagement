import { test, expect } from '@playwright/test';
import { e2eUser } from './config';

test.describe('authentication flow', () => {
  test('redirects unauthenticated users to the login page', async ({ page }) => {
    await page.goto('/app');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('allows a configured user to log in and reach the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(e2eUser.email);
    await page.getByLabel(/password/i).fill(e2eUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/app/);

    await expect(page.getByRole('heading', { name: /olive tree dashboard/i })).toBeVisible();
    await expect(page.getByTestId('metric-students')).not.toHaveText(/^0(?:\.0+)?$/);
  });
});
