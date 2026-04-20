// Global test env. MONGODB_URI is populated by each test suite's beforeAll via mongoHarness.ts
// (mongodb-memory-server is async at startup, so it can't run from this sync setup file).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test_jwt_secret_that_is_at_least_32_characters_long_1234567890";
process.env.LLM_PROVIDER = "stub";
