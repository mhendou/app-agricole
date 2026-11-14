import { defineConfig } from "@playwright/test";

// Utilise Microsoft Edge (déjà présent sous Windows) pour ne rien télécharger.
// Pour Chromium : PW_CHANNEL=chromium npx playwright install chromium
const channel =
  process.env.PW_CHANNEL === "chromium" ? undefined : (process.env.PW_CHANNEL ?? "msedge");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  workers: 1,
  use: { baseURL: "http://localhost:3100", channel },
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100/code",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATA_SOURCE: "mock",
      DATA_DIR: process.env.PW_DATA_DIR ?? ".data-test",
      ALLOW_DEV_CODES: "1",
    },
  },
});
