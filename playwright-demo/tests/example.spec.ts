import { test, expect } from '@playwright/test';

test('abrir la página de ejemplo', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
