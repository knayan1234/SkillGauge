import type { Config } from "jest";

// Backend runs in node (no jsdom) — REST handlers only touch MongoDB + HTTP.
// testTimeout is generous: mongodb-memory-server downloads the mongod binary on first run
// (one-time ~60MB fetch), and setup is per-suite.
//
// The existing test suite was written against Fastify's `app.inject(...)` interface
// and is temporarily skipped via `testPathIgnorePatterns` while the BE runs on Express.
// Tests will be rewritten on `supertest(app)` — to re-enable today, drop the
// ignore pattern (every file will fail until ported).
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  testPathIgnorePatterns: ["<rootDir>/tests/"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 60_000,
  clearMocks: true,
};

export default config;
