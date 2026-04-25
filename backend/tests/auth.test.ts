import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { buildApp } from "../src/app";
import { getDb } from "../src/db/connection";
import type { PasswordResetTokenDoc } from "../src/db/repos/passwordResetTokens";
import { COOKIE_NAME } from "../src/plugins/auth";
import { resetDb, startMongo, stopMongo } from "./mongoHarness";

// Each test rebuilds the app after a db drop. mongod itself stays alive for the whole suite —
// restarting it per test is measurably slower for no benefit.
describe("auth routes", () => {
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

  it("registers a new user and sets a session cookie with the right flags", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "alice@example.com", password: "password123" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe("alice@example.com");
    expect(body.user.id).toBeDefined();
    const setCookie = res.headers["set-cookie"] as string;
    // Cookie surface required by Phase 1.5a: session cookie present + httpOnly + lax + path=/.
    // Secure is gated on NODE_ENV=production and unit tests run in NODE_ENV=test, so it's
    // verified by inspection of plugins/auth.ts:setSessionCookie rather than asserted here.
    expect(setCookie).toEqual(expect.stringContaining("skillgauge_session="));
    expect(setCookie).toEqual(expect.stringContaining("HttpOnly"));
    expect(setCookie).toEqual(expect.stringContaining("SameSite=Lax"));
    expect(setCookie).toEqual(expect.stringContaining("Path=/"));
    expect(setCookie).not.toEqual(expect.stringContaining("Secure"));
  });

  it("rejects duplicate emails with 409 and EMAIL_TAKEN code", async () => {
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "bob@example.com", password: "password123" },
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "bob@example.com", password: "password123" },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      code: "EMAIL_TAKEN",
      message: "Email already registered",
    });
  });

  it("logs in with valid credentials and rejects wrong password with INVALID_CREDENTIALS", async () => {
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "carol@example.com", password: "password123" },
    });

    const good = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "carol@example.com", password: "password123" },
    });
    expect(good.statusCode).toBe(200);

    const bad = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "carol@example.com", password: "wrong-password" },
    });
    expect(bad.statusCode).toBe(401);
    expect(bad.json()).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  });

  it("returns user on /api/me with valid cookie, NOT_AUTHENTICATED without", async () => {
    const reg = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "dave@example.com", password: "password123" },
    });
    const cookie = reg.headers["set-cookie"] as string;

    const authed = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(authed.statusCode).toBe(200);
    expect(authed.json().user.email).toBe("dave@example.com");

    const unauthed = await app.inject({ method: "GET", url: "/api/me" });
    expect(unauthed.statusCode).toBe(401);
    expect(unauthed.json()).toEqual({
      code: "NOT_AUTHENTICATED",
      message: "Not authenticated",
    });
  });

  it("rejects an expired token on /api/me with INVALID_SESSION", async () => {
    // Forge a token that expired 1 second ago. jsonwebtoken.verify treats expiresIn: -1 as
    // "issued at now, expires 1s before now", so the verification fails synchronously.
    const expiredToken = jwt.sign({ sub: "ghost-user" }, process.env.JWT_SECRET!, {
      expiresIn: -1,
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie: `${COOKIE_NAME}=${expiredToken}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({
      code: "INVALID_SESSION",
      message: "Invalid session",
    });
  });

  it("rejects a tampered token on /api/me with INVALID_SESSION", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie: `${COOKIE_NAME}=not-a-real-jwt` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe("INVALID_SESSION");
  });

  it("logout clears the cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
    });
    expect(res.statusCode).toBe(204);
    const setCookie = res.headers["set-cookie"] as string;
    // clearCookie emits an expired / empty value.
    expect(setCookie).toEqual(expect.stringContaining("skillgauge_session="));
    expect(setCookie).toEqual(
      expect.stringMatching(/skillgauge_session=;|Expires=Thu, 01 Jan 1970/),
    );
  });

  it("rejects malformed credentials on login with INVALID_FORMAT (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "not-an-email", password: "x" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "INVALID_FORMAT",
      message: "Invalid credentials format",
    });
  });

  it("rejects malformed credentials on register with INVALID_FORMAT (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "not-an-email", password: "x" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "INVALID_FORMAT",
      message: "Invalid credentials format",
    });
  });

  // --- Phase 1.5d: session rotation via jwt_epoch ---

  it("rejects a token signed with a stale epoch as INVALID_SESSION", async () => {
    // Register, then forge a token with the SAME secret but epoch=0 (one less than the
    // initial epoch=1). Verify the request is rejected on the epoch check, not on
    // signature validity. This proves the new check is doing real work — without it,
    // the epoch=0 token would pass since it's cryptographically valid.
    const reg = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "stale@example.com", password: "password123" },
    });
    const userId = reg.json().user.id;
    const staleToken = jwt.sign(
      { sub: userId, epoch: 0 },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    const res = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie: `${COOKIE_NAME}=${staleToken}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({
      code: "INVALID_SESSION",
      message: "Invalid session",
    });
  });

  it("logout-all bumps epoch and invalidates the issuing cookie", async () => {
    // Sign in, capture cookie. Hit /me successfully. Hit /logout-all with that cookie
    // (passes auth — current epoch matches). Then re-hit /me with the SAME cookie:
    // should now fail because the user's epoch has been bumped past the cookie's epoch.
    const reg = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "logoutall@example.com", password: "password123" },
    });
    const cookie = reg.headers["set-cookie"] as string;

    const before = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(before.statusCode).toBe(200);

    const logoutAll = await app.inject({
      method: "POST",
      url: "/api/auth/logout-all",
      headers: { cookie },
    });
    expect(logoutAll.statusCode).toBe(204);

    const after = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(after.statusCode).toBe(401);
    expect(after.json().code).toBe("INVALID_SESSION");
  });

  it("logout-all without a cookie returns NOT_AUTHENTICATED (requires auth)", async () => {
    // The route is preHandler-guarded — calling it without a cookie should hit the
    // standard requireAuth rejection, not silently no-op. Bumping requires identity.
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/logout-all",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe("NOT_AUTHENTICATED");
  });

  it("password reset confirm bumps the epoch so existing sessions are invalidated", async () => {
    // This closes the known gap from Phase 1.5b: a phished reset link should not leave
    // the original session active. After confirm, the previously-issued cookie must fail.
    const reg = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "resetbump@example.com", password: "password123" },
    });
    const userId = reg.json().user.id;
    const cookie = reg.headers["set-cookie"] as string;

    // Confirm the cookie works pre-reset.
    const before = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(before.statusCode).toBe(200);

    // Insert a reset token directly (mirrors the test pattern from passwordReset.test.ts).
    const plainToken = "b".repeat(64);
    const tokenHash = createHash("sha256").update(plainToken).digest("hex");
    const db = await getDb();
    await db
      .collection<PasswordResetTokenDoc>("password_reset_tokens")
      .insertOne({
        _id: `tok-${Math.random()}`,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      });

    // Consume the reset.
    const confirm = await app.inject({
      method: "POST",
      url: "/api/auth/password/reset-confirm",
      payload: { token: plainToken, newPassword: "newpassword456" },
    });
    expect(confirm.statusCode).toBe(200);

    // The original cookie was issued with epoch=1; reset bumped to epoch=2. So now /me
    // with the old cookie must be rejected.
    const after = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie },
    });
    expect(after.statusCode).toBe(401);
    expect(after.json().code).toBe("INVALID_SESSION");
  });
});
