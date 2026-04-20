import type { Config } from "jest";

// Backend runs in node (no jsdom) — REST handlers only touch MongoDB + HTTP.
// testTimeout is generous: mongodb-memory-server downloads the mongod binary on first run
// (one-time ~60MB fetch), and setup is per-suite.
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 60_000,
  clearMocks: true,
};

export default config;
