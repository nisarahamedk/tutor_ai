import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should display header and call to action buttons', async ({ page }) => {
    // Check for the main heading (Next.js logo)
    await expect(page.getByAltText('Next.js Logo')).toBeVisible();

    // Check for call to action buttons
    await expect(page.getByRole('link', { name: 'Deploy now' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read our docs' })).toBeVisible();
  });

  test('should have correct footer links', async ({ page }) => {
    // Check for footer links and their href attributes
    const footer = page.locator('footer'); // Assuming footer links are within a <footer> element

    await expect(footer.getByRole('link', { name: 'Learn' })).toHaveAttribute('href', 'https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app');
    await expect(footer.getByRole('link', { name: 'Examples' })).toHaveAttribute('href', 'https://github.com/vercel/next.js/tree/canary/examples?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app');
    await expect(footer.getByRole('link', { name: 'Go to nextjs.org' })).toHaveAttribute('href', 'https://nextjs.org?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app');
  });
});
