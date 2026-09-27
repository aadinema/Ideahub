const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Playwright owns both processes so CI does not have to background them.
  // Set PW_SKIP_WEBSERVER=1 to run against servers you started yourself.
  webServer: process.env.PW_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'cd ../server && npm start',
          url: 'http://localhost:5000/health',
          reuseExistingServer: !process.env.CI,
          timeout: 60000,
        },
        {
          command: 'cd ../client && npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
      ],
});
