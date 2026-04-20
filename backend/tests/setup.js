"use strict";
// Global test setup. In-memory DB + disabled logger gives each jest process a fresh schema
// without touching the on-disk skillgauge.db that dev uses.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
    "test_jwt_secret_that_is_at_least_32_characters_long_1234567890";
process.env.DATABASE_URL = ":memory:";
process.env.LLM_PROVIDER = "stub";
//# sourceMappingURL=setup.js.map