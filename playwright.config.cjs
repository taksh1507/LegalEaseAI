const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  testMatch: '*.spec.cjs',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: [['list']],
  use: {
    reducedMotion: 'reduce',
    actionTimeout: 10000,
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: [
    {
      command: 'node tests/browser/server.cjs',
      url: 'http://127.0.0.1:5050/health',
      timeout: 30000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run build && npm run preview -- --port 3000',
      url: 'http://127.0.0.1:3000',
      timeout: 30000,
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://127.0.0.1:5050' },
    },
  ],
});
