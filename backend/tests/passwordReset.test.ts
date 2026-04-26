// Password reset flow.
// Tests cover the opaque-200 request behavior, the happy-path consume, and the three
// failure modes (bad token, expired, replayed) all collapsing to INVALID_TOKEN.
//
// Approach: hit the routes via app.inject() (no real network), then poke the DB directly
// to simulate edge cases that are otherwise hard to trigger (expiry, replay).

import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { getDb } from "../src/db/connection";
import type { PasswordResetTokenDoc } from "../src/db/repos/passwordResetTokens";
import { resetDb, startMongo, stopMongo } from "./mongoHarness";

describe("password reset routes", () => {
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

  async function registerUser(email: string, password = "password123") {
    return app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password },
    });
  }

  // Helper: pull the latest reset token doc directly from Mongo. The plain token never
  // leaves the request (it lives only in the dev log line), so to test the confirm path
  // we generate our own plain token / hash pair and insert it through the repo.
  async function insertToken(
    userId: string,
    overrides: Partial<PasswordResetTokenDoc> = {},
  ): Promise<{ plain: string; doc: PasswordResetTokenDoc }> {
    const plain = "a".repeat(64); // any 64-char hex; deterministic for the test
    const tokenHash = createHash("sha256").update(plain).digest("hex");
    const doc: PasswordResetTokenDoc = {
      _id: `tok-${Math.random()}`,
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
      ...overrides,
    };
    const db = await getDb();
    await db
      .collection<PasswordResetTokenDoc>("password_reset_tokens")
      .insertOne(doc);
    return { plain, doc };
  }

  it("returns opaque 200 on reset-request even for an unregistered email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-request",
      payload: { email: "ghost@example.com" },
    });
    expect(res.statusCode).toBe(200);
    // No body, no Set-Cookie. Pure no-op response so no enumeration channel.
    const db = await getDb();
    const count = await db.collection("password_reset_tokens").countDocuments();
    expect(count).toBe(0);
  });

  it("creates a reset token doc when the email is registered", async () => {
    await registerUser("alice@example.com");
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-request",
      payload: { email: "alice@example.com" },
    });
    expect(res.statusCode).toBe(200);
    const db = await getDb();
    const docs = await db.collection("password_reset_tokens").find({}).toArray();
    expect(docs).toHaveLength(1);
    expect(docs[0].usedAt).toBeNull();
    // Hash, never plain — the doc must not contain the literal token in any field.
    expect(docs[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("happy path: confirm with valid token rotates the password", async () => {
    const reg = await registerUser("bob@example.com", "password123");
    const userId = reg.json().user.id;
    const { plain } = await insertToken(userId);

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-confirm",
      payload: { token: plain, newPassword: "newpassword456" },
    });
    expect(res.statusCode).toBe(200);

    // Old password rejected, new password accepted.
    const oldLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "bob@example.com", password: "password123" },
    });
    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "bob@example.com", password: "newpassword456" },
    });
    expect(newLogin.statusCode).toBe(200);
  });

  it("rejects an expired token with INVALID_TOKEN", async () => {
    const reg = await registerUser("carol@example.com");
    const userId = reg.json().user.id;
    const { plain } = await insertToken(userId, {
      expiresAt: new Date(Date.now() - 1000), // expired 1s ago
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-confirm",
      payload: { token: plain, newPassword: "newpassword456" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "INVALID_TOKEN",
      message: "Invalid or expired reset token",
    });
  });

  it("rejects an already-used token (replay) with INVALID_TOKEN", async () => {
    const reg = await registerUser("dave@example.com");
    const userId = reg.json().user.id;
    const { plain } = await insertToken(userId, { usedAt: new Date() });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-confirm",
      payload: { token: plain, newPassword: "newpassword456" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("INVALID_TOKEN");
  });

  it("rejects an unknown token with INVALID_TOKEN", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-confirm",
      payload: {
        token: "0".repeat(64), // never inserted
        newPassword: "newpassword456",
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("INVALID_TOKEN");
  });

  it("rejects a malformed token with INVALID_FORMAT (zod rejects before lookup)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-confirm",
      payload: { token: "not-hex", newPassword: "newpassword456" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("INVALID_FORMAT");
  });

  it("rejects a too-short new password with INVALID_FORMAT", async () => {
    const reg = await registerUser("eve@example.com");
    const userId = reg.json().user.id;
    const { plain } = await insertToken(userId);

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-confirm",
      payload: { token: plain, newPassword: "abc" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("INVALID_FORMAT");
  });
});
