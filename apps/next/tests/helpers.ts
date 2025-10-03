import type { Page } from '@playwright/test';
import { e2eUser } from './config';

export async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(e2eUser.email);
  await page.getByLabel(/password/i).fill(e2eUser.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/app/);
}
