import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
// Use localhost rather than 127.0.0.1: Next dev blocks cross-origin dev
// resources (including HMR) when the hostname does not match.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const externalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalServer
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          KBP_DISABLE_LIVE_NEWS: "1",
          KBP_DATA_DIR: "tests/.e2e-data",
          NEXT_TELEMETRY_DISABLED: "1",
        },
      },
});
