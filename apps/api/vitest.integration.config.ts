import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

try {
  process.loadEnvFile(".env");
} catch {
  // CI passes TEST_DATABASE_URL directly.
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["integration/**/*.test.ts"],
    globalSetup: ["integration/global-setup.ts"],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 20_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      UPLOADS_DIR: mkdtempSync(path.join(tmpdir(), "op-uploads-")),
    },
  },
});
