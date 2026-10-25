import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // One seeded database is shared by every test, so they run one at a time.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.js',
  use: {
    // Not localhost: Node may resolve that to ::1, miss the server on 127.0.0.1, and try to start a second one.
    baseURL: 'http://127.0.0.1:4667',
    trace: 'retain-on-failure',
  },
  projects: [
    // The drawer specs expect the seeded movies in rows of 7, which this width gives.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1500, height: 900 } } },
  ],
  webServer: {
    command: 'bundle exec ruby e2e/server.rb',
    url: 'http://127.0.0.1:4667',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
