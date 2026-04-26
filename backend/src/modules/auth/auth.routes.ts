/**
 * Auth routes: register, login, logout, logout-all, password reset (request + confirm),
 * and the /api/me identity probe.
 *
 * Every error response uses the project-wide {code, message} shape. Login failures and
 * reset-request hits go through pino with hashed email + IP for forensics — the raw
 * email never lands in logs.
 */

import { Router, type Application, type Request, type Response } from "express";
import { usersRepo } from "@/db/repos/users";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signSessionToken,
} from "@/plugins/auth";
import { buildAuthRateLimiter } from "@/plugins/rateLimit";
import { hashEmailForLog } from "@/shared/audit";
import {
  credentialsSchema,
  resetConfirmSchema,
  resetRequestSchema,
} from "@/shared/contracts";
import { AuthError, authService } from "./auth.service";
import {
  PasswordResetError,
  passwordResetService,
} from "./password.service";

// Helper to wire async route handlers into Express. Express 5 supports returned Promises
// natively (rejections flow into the error funnel), but we still wrap so any synchronous
// throw before the await is also caught — defence in depth around the error handler.
type AsyncHandler = (req: Request, res: Response) => Promise<void | Response>;
const wrap = (fn: AsyncHandler) => (req: Request, res: Response, next: import("express").NextFunction) =>
  Promise.resolve(fn(req, res)).catch(next);

export function authRoutes(app: Application): void {
  const router = Router();
  // One shared per-IP limiter for login + reset-request. Sharing the instance means a
  // single attacker can't split traffic between the two routes to double the effective cap.
  const authLimiter = buildAuthRateLimiter();

  router.post(
    "/register",
    wrap(async (req, res) => {
      const parsed = credentialsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid credentials format",
        });
        return;
      }
      try {
        const { user, epoch } = await authService.register(
          parsed.data.email,
          parsed.data.password,
        );
        setSessionCookie(res, signSessionToken(user.id, epoch));
        res.status(201).json({ user });
      } catch (err) {
        if (err instanceof AuthError && err.code === "EMAIL_TAKEN") {
          res.status(409).json({ code: err.code, message: err.message });
          return;
        }
        throw err;
      }
    }),
  );

  router.post(
    "/login",
    authLimiter,
    wrap(async (req, res) => {
      const parsed = credentialsSchema.safeParse(req.body);
      if (!parsed.success) {
        // Try to surface a hashed correlator even on malformed payloads when an email-like
        // string is present. Mirrors the rate-limit-by-emailHash story for invalid bodies.
        const rawEmail =
          typeof (req.body as { email?: unknown } | null)?.email === "string"
            ? ((req.body as { email: string }).email)
            : undefined;
        req.log.warn(
          {
            event: "auth.login.failed",
            ip: req.ip,
            emailHash: rawEmail ? hashEmailForLog(rawEmail) : undefined,
            reason: "INVALID_FORMAT",
          },
          "login failed",
        );
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid credentials format",
        });
        return;
      }
      try {
        const { user, epoch } = await authService.login(
          parsed.data.email,
          parsed.data.password,
          req.ip ?? "unknown",
        );
        setSessionCookie(res, signSessionToken(user.id, epoch));
        res.json({ user });
      } catch (err) {
        if (err instanceof AuthError) {
          // Audit log: hashed email + IP + reason. Never the raw email or password. These
          // counts (via the login_attempts collection, written by authService.login) drive
          // the per-email lockout decision.
          req.log.warn(
            {
              event: "auth.login.failed",
              ip: req.ip,
              emailHash: hashEmailForLog(parsed.data.email),
              reason: err.code,
            },
            "login failed",
          );
          // 423 Locked for soft lockout (RFC 4918) — distinct from 429 (too many requests
          // / rate limit) so the FE can show the right message: "wait 15 minutes or reset."
          const status = err.code === "ACCOUNT_LOCKED" ? 423 : 401;
          res.status(status).json({ code: err.code, message: err.message });
          return;
        }
        throw err;
      }
    }),
  );

  // Logout is public — hitting it without a cookie is still a valid no-op (clears nothing).
  router.post("/logout", (_req, res) => {
    clearSessionCookie(res);
    res.status(204).send();
  });

  // Log-out-everywhere. Bumps the user's `jwtEpoch`, which makes EVERY existing token
  // signed for this user fail the requireAuth check on the next request (their `epoch` <
  // new `jwtEpoch`). Then we clear the *current* request's cookie so the FE doesn't keep
  // trying with a now-dead token.
  router.post(
    "/logout-all",
    requireAuth,
    wrap(async (req, res) => {
      await usersRepo.bumpJwtEpoch(req.userId!);
      clearSessionCookie(res);
      res.status(204).send();
    }),
  );

  // --- Password reset ----------------------------------------------------------------
  // Two-step flow:
  //   1) request — opaque 200; never reveals whether the email exists. If it does, a
  //      single-use TTL'd token is generated and (in dev) logged to stdout.
  //   2) confirm — consumes the token, bcrypts the new password, marks token used.
  // Both routes are public (no requireAuth). Per-IP rate limit on /reset-request.
  router.post(
    "/password/reset-request",
    authLimiter,
    wrap(async (req, res) => {
      const parsed = resetRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        // Bad-format requests still get 200 — we don't want to leak "email shape was wrong"
        // either. Just no-op silently.
        res.status(200).send();
        return;
      }
      const result = await passwordResetService.requestReset(parsed.data.email);
      if (result.link) {
        // Dev-only stdout sink. Production sends mail via a provider.
        // Logging the link at INFO so it's visible in the dev terminal but not warn-level
        // noise in CI/prod log shipping.
        req.log.info(
          {
            event: "auth.password.reset_link_issued",
            emailHash: hashEmailForLog(parsed.data.email),
            link: result.link,
          },
          "password reset link issued (dev sink)",
        );
      }
      // Same opaque 200 either way. No body, no Set-Cookie, no enumeration vector.
      res.status(200).send();
    }),
  );

  router.post(
    "/password/reset-confirm",
    wrap(async (req, res) => {
      const parsed = resetConfirmSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid token or password format",
        });
        return;
      }
      try {
        await passwordResetService.confirmReset(
          parsed.data.token,
          parsed.data.newPassword,
        );
        res.status(200).send();
      } catch (err) {
        if (err instanceof PasswordResetError) {
          res.status(400).json({ code: err.code, message: err.message });
          return;
        }
        throw err;
      }
    }),
  );

  // Mounted under /api/auth. The /me endpoint isn't auth-rooted but lives next to the
  // auth router because it's the read counterpart to register/login (returns the
  // currently-authenticated user).
  app.use("/api/auth", router);

  // /api/me sits at the root of /api — register it directly on the app.
  app.get(
    "/api/me",
    requireAuth,
    wrap(async (req, res) => {
      const user = await authService.getById(req.userId!);
      if (!user) {
        // Token valid but user deleted — force the FE to clear its cached identity.
        clearSessionCookie(res);
        res.status(401).json({
          code: "USER_NOT_FOUND",
          message: "User no longer exists",
        });
        return;
      }
      res.json({ user });
    }),
  );
}
