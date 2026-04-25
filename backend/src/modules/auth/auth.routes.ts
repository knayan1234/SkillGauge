import type { FastifyInstance } from "fastify";
import { env } from "@/config/env";
import { usersRepo } from "@/db/repos/users";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signSessionToken,
} from "@/plugins/auth";
import { hashEmailForLog } from "@/shared/audit";
import { credentialsSchema } from "./auth.schema";
import { AuthError, authService } from "./auth.service";
import {
  resetConfirmSchema,
  resetRequestSchema,
} from "./password.schema";
import {
  PasswordResetError,
  passwordResetService,
} from "./password.service";

// Phase 1.5c — rate-limit config object shared by routes that need per-IP throttling.
// We declare it once so login + reset-request share identical policy and a future
// auditor can grep for `RATE_LIMIT_AUTH` to find every protected route.
const RATE_LIMIT_AUTH = {
  rateLimit: { max: env.AUTH_RATE_PER_MIN, timeWindow: "1 minute" },
} as const;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/auth/register", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        code: "INVALID_FORMAT",
        message: "Invalid credentials format",
      });
    }
    try {
      const { user, epoch } = await authService.register(
        parsed.data.email,
        parsed.data.password,
      );
      setSessionCookie(reply, signSessionToken(user.id, epoch));
      return reply.code(201).send({ user });
    } catch (err) {
      if (err instanceof AuthError && err.code === "EMAIL_TAKEN") {
        return reply.code(409).send({ code: err.code, message: err.message });
      }
      throw err;
    }
  });

  app.post("/api/auth/login", { config: RATE_LIMIT_AUTH }, async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      // Try to surface a hashed correlator even on malformed payloads when an email-like
      // string is present. This lets 1.5c rate-limit by emailHash without parsing the body again.
      const rawEmail =
        typeof (request.body as { email?: unknown } | null)?.email === "string"
          ? ((request.body as { email: string }).email)
          : undefined;
      request.log.warn(
        {
          event: "auth.login.failed",
          ip: request.ip,
          emailHash: rawEmail ? hashEmailForLog(rawEmail) : undefined,
          reason: "INVALID_FORMAT",
        },
        "login failed",
      );
      return reply.code(400).send({
        code: "INVALID_FORMAT",
        message: "Invalid credentials format",
      });
    }
    try {
      const { user, epoch } = await authService.login(
        parsed.data.email,
        parsed.data.password,
        request.ip,
      );
      setSessionCookie(reply, signSessionToken(user.id, epoch));
      return reply.send({ user });
    } catch (err) {
      if (err instanceof AuthError) {
        // Audit log: hashed email + IP + reason. Never the raw email or password. Phase 1.5c
        // counts these (via the login_attempts collection, written by authService.login)
        // for the per-email lockout decision.
        request.log.warn(
          {
            event: "auth.login.failed",
            ip: request.ip,
            emailHash: hashEmailForLog(parsed.data.email),
            reason: err.code,
          },
          "login failed",
        );
        // 423 Locked for soft lockout (RFC 4918) — distinct from 429 (too many requests
        // / rate limit) so the FE can show the right message: "wait 15 minutes or reset."
        const status = err.code === "ACCOUNT_LOCKED" ? 423 : 401;
        return reply.code(status).send({ code: err.code, message: err.message });
      }
      throw err;
    }
  });

  // Logout is public — hitting it without a cookie is still a valid no-op (clears nothing).
  app.post("/api/auth/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  // Phase 1.5d — log-out-everywhere. Bumps the user's `jwtEpoch`, which makes EVERY
  // existing token signed for this user fail the requireAuth check on the next request
  // (their `epoch` < new `jwtEpoch`). Then we clear the *current* request's cookie so
  // the FE doesn't keep trying with a now-dead token.
  //
  // Requires auth — caller must already be holding a valid session to bump their own
  // epoch. There's no "bump someone else's epoch" path; that would be admin-only and is
  // not in scope before Phase 4.
  //
  // TODO:phase-1.6 expose a "Sign out everywhere" button in a settings UI that calls this.
  app.post(
    "/api/auth/logout-all",
    { preHandler: requireAuth },
    async (request, reply) => {
      await usersRepo.bumpJwtEpoch(request.userId!);
      clearSessionCookie(reply);
      return reply.code(204).send();
    },
  );

  // --- Password reset (Phase 1.5b) ---------------------------------------------------
  // Two-step flow:
  //   1) request — opaque 200; never reveals whether the email exists. If it does, a
  //      single-use TTL'd token is generated and (in dev) logged to stdout.
  //   2) confirm — consumes the token, bcrypts the new password, marks token used.
  // Both routes are public (no requireAuth). 1.5c will add per-IP/per-email rate limits.
  // TODO:phase-4 swap the dev-mode stdout sink for transactional mail.

  app.post(
    "/api/auth/password/reset-request",
    { config: RATE_LIMIT_AUTH },
    async (request, reply) => {
    const parsed = resetRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      // Bad-format requests still get 200 — we don't want to leak "email shape was wrong"
      // either. Just no-op silently.
      return reply.code(200).send();
    }
    const result = await passwordResetService.requestReset(parsed.data.email);
    if (result.link) {
      // Dev-only stdout sink. Production (Phase 4) sends mail via a provider.
      // Logging the link at INFO so it's visible in the dev terminal but not warn-level
      // noise in CI/prod log shipping.
      request.log.info(
        {
          event: "auth.password.reset_link_issued",
          emailHash: hashEmailForLog(parsed.data.email),
          link: result.link,
        },
        "password reset link issued (dev sink)",
      );
    }
    // Same opaque 200 either way. No body, no Set-Cookie, no enumeration vector.
    return reply.code(200).send();
  });

  app.post("/api/auth/password/reset-confirm", async (request, reply) => {
    const parsed = resetConfirmSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        code: "INVALID_FORMAT",
        message: "Invalid token or password format",
      });
    }
    try {
      await passwordResetService.confirmReset(
        parsed.data.token,
        parsed.data.newPassword,
      );
      return reply.code(200).send();
    } catch (err) {
      if (err instanceof PasswordResetError) {
        return reply.code(400).send({ code: err.code, message: err.message });
      }
      throw err;
    }
  });

  app.get(
    "/api/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = await authService.getById(request.userId!);
      if (!user) {
        // Token valid but user deleted — force the FE to clear its cached identity.
        clearSessionCookie(reply);
        return reply.code(401).send({
          code: "USER_NOT_FOUND",
          message: "User no longer exists",
        });
      }
      return reply.send({ user });
    },
  );
}
