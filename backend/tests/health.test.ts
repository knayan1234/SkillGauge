/**
 * Health endpoints.
 *
 * /api/health is the liveness probe; /api/health/info is the public payload that
 * powers the FE LlmBadge. Tests pin down the JSON contract so a future change to the
 * shape doesn't silently break the badge.
 */

import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { resetDb, startMongo, stopMongo } from "./mongoHarness";

describe("health routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startMongo();
  });

  afterAll(async () => {
    await stopMongo();
  });

  beforeEach(async () => {
    await resetDb();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("/api/health returns liveness ok with no auth required", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("/api/health/info exposes the active LLM provider for the FE badge", async () => {
    // Test env sets LLM_PROVIDER=stub via tests/setup.ts.
    const res = await app.inject({ method: "GET", url: "/api/health/info" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.llmProvider).toBe("stub");
    // llmModel is null when the provider is the stub. Real providers populate it
    // from their per-provider env vars. The field is always present (typed as
    // string | null) so callers don't have to guard for its existence.
    expect(body.llmModel).toBeNull();
  });

  it("/api/health/info is public — no cookie required", async () => {
    // No headers, no auth — the badge needs to work on the landing page too where the
    // user might not be signed in yet (though we currently only render it in the
    // interview header, that's a UI choice, not a security boundary).
    const res = await app.inject({ method: "GET", url: "/api/health/info" });
    expect(res.statusCode).toBe(200);
  });
});
