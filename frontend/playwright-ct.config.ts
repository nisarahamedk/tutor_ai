import { defineConfig, devices } from '@playwright/experimental-ct-react';
import path from 'path'; // Added for alias resolution

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './', // Root for component tests, or specify a components sub-directory
  /* The base directory, relative to the config file, for snapshot files. */
  snapshotDir: './__snapshots__',
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,

    // TASK-001: Add Vitest's setup file for consistency if it contains global setup
    // not directly applicable to Playwright CT in this way, but we ensure similar context is available
    // For Playwright CT, context like MSW or global styles would be set up in a test hook or custom render function if needed
    // We will rely on the individual component tests to import necessary setups or use global setups via test hooks.

    // Aliases - TASK-001 asks to mirror Vitest config
    ctViteConfig: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
