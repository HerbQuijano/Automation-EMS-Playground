// @ts-check
import { defineConfig, devices, expect } from "@playwright/test";

const appUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["line"],
    [
      "html",
      {
        outputFolder: "reports/html",
        open: "never",
      },
    ],
    [
      "allure-playwright",
      {
        resultsDir: "reports/allure-results",
      },
    ],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: appUrl,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    timeouts: {
      action: 10 * 1000,
      navigation: 30 * 1000,
      expect: 5 * 1000,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev servers before starting the tests */
  webServer: [
    {
      command: "npm run db:reset && npm run dev:api",
      url: "http://127.0.0.1:3000/api/health",
      stdout: "ignore",
      stderr: "ignore",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev:web",
      url: appUrl,
      stdout: "ignore",
      stderr: "ignore",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
