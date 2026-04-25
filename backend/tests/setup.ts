// Global test env. MONGODB_URI is populated by each test suite's beforeAll via mongoHarness.ts
// (mongodb-memory-server is async at startup, so it can't run from this sync setup file).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test_jwt_secret_that_is_at_least_32_characters_long_1234567890";
process.env.LLM_PROVIDER = "stub";
// Phase 1.5c: most tests do many logins per case (especially the lockout suite, which
// fires 10+ attempts to verify counting). Default cap is 10/min which would interfere.
// We set the per-IP cap absurdly high here, and the dedicated rate-limit test re-asserts
// the real production behavior by configuring its own low cap on a custom app instance.
process.env.AUTH_RATE_PER_MIN = "10000";
