import { defineConfig, devices } from "@playwright/test"

/**
 * The e2e suite.
 *
 * @remarks
 * One browser: chromium. The suite runs against the real app, started by
 * Playwright itself, so it always tests what the developer would see.
 *
 * The port is 3101 on purpose: it does not collide with a `pnpm dev` the
 * developer has running on 3000.
 */
const PORT = Number(process.env.E2E_PORT ?? 3101)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: "./e2e",
  // One worker in CI: the app is shared, and a suite that fights itself is
  // worse than a slow suite.
  workers: isCI ? 1 : undefined,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm --filter web exec next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
})
