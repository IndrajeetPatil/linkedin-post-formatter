import { defineConfig, devices } from "@playwright/test";

// Runs the end-to-end test against the production build, served under the
// same /<repository>/ base path that GitHub Pages uses.
const base = "/linkedin-post-formatter/";

export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  forbidOnly: Boolean(process.env["CI"]),
  use: { baseURL: `http://localhost:4173${base}` },
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
    { name: "firefox", use: devices["Desktop Firefox"] },
    { name: "webkit", use: devices["Desktop Safari"] },
  ],
  webServer: {
    command: "vp build && vp preview --port 4173 --strictPort",
    env: { PAGES_BASE: base },
    url: `http://localhost:4173${base}`,
    reuseExistingServer: !process.env["CI"],
  },
});
