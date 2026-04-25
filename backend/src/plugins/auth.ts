/**
 * JWT cookie session helpers + the `requireAuth` Fastify preHandler.
 *
 * The session token is the only thing that proves identity on a request — the cookie is
 * just transport. Phase 1 set up the basic sign + verify; Phase 1.5a moved TTL to env and
 * tightened cookie flags; Phase 1.5d added per-user `epoch` to support
 * "log-out-everywhere" without rotating the global JWT_SECRET.
 *
 * See ARCHITECTURE.md §9.1 for the full lifecycle walkthrough (token anatomy, sign,
 * cookie transport, verify, cross-origin handshake, rotation).
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { usersRepo } from "@/db/repos/users";

export const COOKIE_NAME = "skillgauge_session";

// What we encode in the JWT payload. `sub` is the user UUID — that's all we need to
// resolve the user. `epoch` is the user's `jwtEpoch` at sign-time (Phase 1.5d). On verify
// we compare `payload.epoch` against the user's current `jwtEpoch` — older tokens lose.
interface SessionPayload {
  sub: string;
  epoch: number;
}

declare module "fastify" {
  interface FastifyRequest {
    // Populated by requireAuth; absent on public routes.
    userId?: string;
  }
}

/**
 * Sign a fresh session token for a user. Caller must pass the user's CURRENT jwtEpoch —
 * whatever's in the database right now. If the epoch ever bumps (logout-all, password
 * reset), every token signed before that moment becomes invalid on the next request.
 */
export function signSessionToken(userId: string, epoch: number): string {
  return jwt.sign(
    { sub: userId, epoch } satisfies SessionPayload,
    env.JWT_SECRET,
    { expiresIn: `${env.JWT_TTL_DAYS}d` },
  );
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  // httpOnly: blocks JS access (XSS mitigation — the Phase 1 upgrade from localStorage).
  // sameSite: "lax" is the sweet spot: blocks CSRF on state-changing cross-site requests
  //   while letting top-level navigation carry the cookie.
  // secure is only set in production — local dev uses http://localhost.
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * env.JWT_TTL_DAYS,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAME, { path: "/" });
}

/**
 * Route-level guard. Use as `preHandler: requireAuth` on any handler that needs
 * `request.userId`. Three rejection paths, all returning 401 with a structured body so
 * the FE can branch:
 *   1. No cookie at all                -> NOT_AUTHENTICATED
 *   2. Cookie present but invalid      -> INVALID_SESSION
 *      (expired / tampered / wrong secret / epoch mismatch)
 *
 * We deliberately do NOT distinguish the sub-cases of #2 in the response — an attacker
 * doesn't need a hint about which check failed. The pino log line at debug level gives
 * developers the detail when they grep their logs.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies[COOKIE_NAME];
  if (!token) {
    reply
      .code(401)
      .send({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });
    return;
  }

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
  } catch {
    // Any verification failure (expired, tampered, wrong secret) — reject without leaking
    // the precise reason. 1.5d's epoch check is below; same "INVALID_SESSION" shape.
    reply
      .code(401)
      .send({ code: "INVALID_SESSION", message: "Invalid session" });
    return;
  }

  // Phase 1.5d epoch check: the user may have rotated their epoch (logout-all, password
  // reset). If so, even a cryptographically-valid token is dead.
  // We tolerate `payload.epoch` being undefined (for tokens signed pre-1.5d) by treating
  // it as 1 — the initial epoch. Once the first bump happens, those legacy tokens fail.
  const tokenEpoch = payload.epoch ?? 1;
  const user = await usersRepo.findById(payload.sub);
  if (!user) {
    // User deleted while their session was live — reject. Distinct from the /me handler's
    // "user no longer exists" path, which checks AFTER preHandler succeeds. Reaching here
    // means the JWT was valid AND signed by us, but the row is gone — treat as logged out.
    reply
      .code(401)
      .send({ code: "INVALID_SESSION", message: "Invalid session" });
    return;
  }
  const userEpoch = user.jwtEpoch ?? 1;
  if (tokenEpoch < userEpoch) {
    reply
      .code(401)
      .send({ code: "INVALID_SESSION", message: "Invalid session" });
    return;
  }

  request.userId = payload.sub;
}

// No-op registration — keeps the plugin pattern available if we later add decorators.
export async function authPlugin(_app: FastifyInstance): Promise<void> {
  // Placeholder; auth state lives on FastifyRequest via module augmentation above.
}
