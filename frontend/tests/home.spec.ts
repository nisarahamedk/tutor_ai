import { test, expect } from '@playwright/test';

test('has Next.js logo', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Expect an element with alt text "Next.js Logo" to be visible.
  await expect(page.getByAltText('Next.js Logo')).toBeVisible();
});
