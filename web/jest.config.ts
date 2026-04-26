import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // ESM-only packages stubbed for the test runner. react-markdown + remark-gfm pull
    // a long chain of ESM dependencies (unified, mdast-*, micromark-*, …); rather than
    // configure Jest to transform all of them, we render content via a plain <div>
    // stub. Tests that needed markdown output specifically would mock per-test instead.
    "^react-markdown$": "<rootDir>/__mocks__/react-markdown.tsx",
    "^remark-gfm$": "<rootDir>/__mocks__/remark-gfm.ts",
  },
  testMatch: ["<rootDir>/**/*.test.ts", "<rootDir>/**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default createJestConfig(config);
