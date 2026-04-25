import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { buildApp } from "../src/app";
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
});
