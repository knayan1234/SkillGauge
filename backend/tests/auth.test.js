"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../src/app");
const connection_1 = require("../src/db/connection");
// Each test file gets its own buildApp(), which runs migrations against the in-memory DB.
// closeDb() between tests ensures the singleton resets — see connection.ts.
describe("auth routes", () => {
    let app;
    beforeEach(async () => {
        (0, connection_1.closeDb)();
        app = await (0, app_1.buildApp)();
    });
    afterEach(async () => {
        await app.close();
        (0, connection_1.closeDb)();
    });
    it("registers a new user and sets a session cookie", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/auth/register",
            payload: { email: "alice@example.com", password: "password123" },
        });
        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.user.email).toBe("alice@example.com");
        expect(body.user.id).toBeDefined();
        const setCookie = res.headers["set-cookie"];
        expect(setCookie).toEqual(expect.stringContaining("skillgauge_session="));
        expect(setCookie).toEqual(expect.stringContaining("HttpOnly"));
    });
    it("rejects duplicate emails with 409", async () => {
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
    });
    it("logs in with valid credentials and rejects wrong password", async () => {
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
    });
    it("returns user on /api/me with valid cookie, 401 without", async () => {
        const reg = await app.inject({
            method: "POST",
            url: "/api/auth/register",
            payload: { email: "dave@example.com", password: "password123" },
        });
        const cookie = reg.headers["set-cookie"];
        const authed = await app.inject({
            method: "GET",
            url: "/api/me",
            headers: { cookie },
        });
        expect(authed.statusCode).toBe(200);
        expect(authed.json().user.email).toBe("dave@example.com");
        const unauthed = await app.inject({ method: "GET", url: "/api/me" });
        expect(unauthed.statusCode).toBe(401);
    });
    it("logout clears the cookie", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/auth/logout",
        });
        expect(res.statusCode).toBe(204);
        const setCookie = res.headers["set-cookie"];
        expect(setCookie).toEqual(expect.stringContaining("skillgauge_session="));
        // clearCookie emits an expired / empty value.
        expect(setCookie).toEqual(expect.stringMatching(/skillgauge_session=;|Expires=Thu, 01 Jan 1970/));
    });
    it("rejects malformed credentials with 400", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: { email: "not-an-email", password: "x" },
        });
        expect(res.statusCode).toBe(400);
    });
});
//# sourceMappingURL=auth.test.js.map