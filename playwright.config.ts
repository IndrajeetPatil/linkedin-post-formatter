import { defineConfig, devices } from "@playwright/test";

// Runs the end-to-end test against the production build, served under the
// same /<repository>/ base path that GitHub Pages uses.
const base = "/linkedin-post-formatter/";
const isCI = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts",
  timeout: 120_000,
  forbidOnly: isCI,
  // GitHub's hosted runners for public repositories have 4 vCPUs; use them
  // all on CI instead of Playwright's default of half the cores.
  // Spread rather than assign `undefined`: `exactOptionalPropertyTypes` rejects
  // an explicit undefined.
  ...(isCI ? { workers: 4 } : {}),
  // Spread individual tests, not whole files, across the workers; each test
  // opens its own page, so none depends on another.
  fullyParallel: true,
  reporter: isCI
    ? [
        ["dot"],
        ["github"],
        [
          "html",
          {
            open: "never",
          },
        ],
      ]
    : "list",
  use: { baseURL: `http://localhost:4173${base}` },
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
    { name: "firefox", use: devices["Desktop Firefox"] },
    { name: "webkit", use: devices["Desktop Safari"] },
    // Phones: touch input, narrow viewports, and mobile Safari and Chrome.
    { name: "iphone", use: devices["iPhone 15"] },
    { name: "android", use: devices["Pixel 7"] },
  ],
  webServer: {
    command: "vp build && vp preview --port 4173 --strictPort",
    env: { PAGES_BASE: base },
    url: `http://localhost:4173${base}`,
    reuseExistingServer: !process.env["CI"],
  },
});
