/**
 * Cost-guard tests for the sessions service.
 *
 * Two guards exercised:
 *   1. INPUT_TOO_LARGE — single LLM-call input exceeds MAX_INPUT_CHARS (default 10k chars).
 *      Triggered by feeding an oversize JD or resume.
 *   2. QUOTA_EXCEEDED — daily token quota reached. Simulated by directly inserting a
 *      `usage_quotas` doc with tokensUsed >= the limit before the call.
 *
 * The default env limits (DAILY_TOKEN_LIMIT=100000, MAX_INPUT_CHARS=10000) are
 * generous enough that the existing sessions.test.ts cases stay green; this file's
 * cases deliberately push past those limits.
 *
 * We exercise INPUT_TOO_LARGE by sending a JD long enough to trip the cap. The 50-char
 * MIN on `jobDescription` (set in `initSessionSchema`) is far below the 10k-char MAX
 * we're testing, so we just send 11k chars of repeated text.
 *
 * For QUOTA_EXCEEDED we insert a usage_quotas doc directly so the test doesn't have
 * to actually drain a quota by making real-ish LLM calls.
 */

import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { getDb } from "../src/db/connection";
import { utcDayKey, type UsageQuotaDoc } from "../src/db/repos/usageQuotas";
import { resetDb, startMongo, stopMongo } from "./mongoHarness";

const RESUME_PLAINTEXT = "Jane Doe — Senior Engineer";
const RESUME_BASE64 = Buffer.from(RESUME_PLAINTEXT, "utf8").toString("base64");

async function registerAndGetCookie(
  app: FastifyInstance,
  email: string,
): Promise<{ cookie: string; userId: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password: "password123" },
  });
  return {
    cookie: res.headers["set-cookie"] as string,
    userId: res.json().user.id,
  };
}

const baseInitPayload = {
  resumeFileName: "resume.txt",
  resumeContent: RESUME_BASE64,
  resumeMime: "text/plain",
  jobDescription:
    "We are hiring a senior backend engineer with experience in distributed systems and cloud infrastructure",
  interviewStyle: "mixed" as const,
  difficulty: "medium" as const,
  roleLevel: "mid" as const,
  questionCount: 3 as const,
};

describe("cost guards", () => {
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

  it("rejects a session-init with an oversize JD as INPUT_TOO_LARGE (413)", async () => {
    const { cookie } = await registerAndGetCookie(app, "fat-jd@example.com");
    // Default MAX_INPUT_CHARS is 10000; JD field max in zod is 10000. We send the
    // largest JD the schema permits, which together with even a small resume
    // pushes past the 10k input cap.
    const giantJd = "x".repeat(10_000);
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: { ...baseInitPayload, jobDescription: giantJd },
    });
    expect(res.statusCode).toBe(413);
    expect(res.json()).toEqual({
      code: "INPUT_TOO_LARGE",
      message: expect.stringMatching(/per-call cap/i),
    });
  });

  it("rejects a session-init when the user has already hit their daily token quota (402)", async () => {
    const { cookie, userId } = await registerAndGetCookie(
      app,
      "drained@example.com",
    );
    // Plant a usage_quotas doc that says the user is already over the limit.
    // Default DAILY_TOKEN_LIMIT is 100000 — set tokensUsed well past it so any
    // pre-call check fires.
    const day = utcDayKey();
    const db = await getDb();
    await db.collection<UsageQuotaDoc>("usage_quotas").insertOne({
      _id: `${userId}:${day}`,
      userId,
      day,
      tokensUsed: 999_999,
      callsMade: 100,
      expiresAt: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: baseInitPayload,
    });
    expect(res.statusCode).toBe(402);
    expect(res.json()).toEqual({
      code: "QUOTA_EXCEEDED",
      message: expect.stringMatching(/daily token quota/i),
    });
  });

  it("records token usage on a successful session init", async () => {
    const { cookie, userId } = await registerAndGetCookie(
      app,
      "first-day@example.com",
    );
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: baseInitPayload,
    });
    expect(res.statusCode).toBe(201);

    // After init, the user should have a quota doc with tokensUsed > 0.
    const day = utcDayKey();
    const db = await getDb();
    const doc = await db
      .collection<UsageQuotaDoc>("usage_quotas")
      .findOne({ _id: `${userId}:${day}` });
    expect(doc).not.toBeNull();
    expect(doc!.tokensUsed).toBeGreaterThan(0);
    expect(doc!.callsMade).toBeGreaterThanOrEqual(1);
  });

  it("rejects an oversize answer payload as INPUT_TOO_LARGE", async () => {
    // Schema permits answer.length up to 10000; default MAX_INPUT_CHARS is also 10000.
    // Together with the existing resume/JD/history this should trip the guard.
    const { cookie } = await registerAndGetCookie(
      app,
      "long-answer@example.com",
    );
    const init = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: baseInitPayload,
    });
    expect(init.statusCode).toBe(201);
    const sessionId = init.json().session.id as string;

    const res = await app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/answers`,
      headers: { cookie },
      payload: { answer: "y".repeat(10_000) },
    });
    expect(res.statusCode).toBe(413);
    expect(res.json().code).toBe("INPUT_TOO_LARGE");
  });
});
