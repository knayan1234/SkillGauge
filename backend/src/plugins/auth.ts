/**
 * JWT cookie session helpers + the `requireAuth` Express middleware.
 *
 * The session token is the only thing that proves identity on a request — the cookie is
 * just transport. Per-user `epoch` supports "log-out-everywhere" without rotating the
 * global JWT_SECRET.
 *
 * See ARCHITECTURE.md §9.1 for the full lifecycle walkthrough (token anatomy, sign,
 * cookie transport, verify, cross-origin handshake, rotation).
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { usersRepo } from "@/db/repos/users";

export const COOKIE_NAME = "skillgauge_session";

// What we encode in the JWT payload. `sub` is the user UUID — that's all we need to
// resolve the user. `epoch` is the user's `jwtEpoch` at sign-time. On verify we compare
// `payload.epoch` against the user's current `jwtEpoch` — older tokens lose.
interface SessionPayload {
  sub: string;
  epoch: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Populated by requireAuth; absent on public routes.
    interface Request {
      userId?: string;
    }
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

export function setSessionCookie(res: Response, token: string): void {
  // httpOnly: blocks JS access (XSS mitigation — the upgrade from localStorage).
  // sameSite: "lax" is the sweet spot: blocks CSRF on state-changing cross-site requests
  //   while letting top-level navigation carry the cookie.
  // secure is only set in production — local dev uses http://localhost.
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * env.JWT_TTL_DAYS * 1000, // Express cookie maxAge is in ms
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

/**
 * Route-level guard. Use as `router.use(requireAuth)` on a Router that needs
 * `req.userId`, or pass it as a per-route middleware argument. Three rejection paths,
 * all returning 401 with a structured body so the FE can branch:
 *   1. No cookie at all                -> NOT_AUTHENTICATED
 *   2. Cookie present but invalid      -> INVALID_SESSION
 *      (expired / tampered / wrong secret / epoch mismatch)
 *
 * We deliberately do NOT distinguish the sub-cases of #2 in the response — an attacker
 * doesn't need a hint about which check failed. The pino log line at debug level gives
 * developers the detail when they grep their logs.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res
      .status(401)
      .json({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });
    return;
  }

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
  } catch {
    // Any verification failure (expired, tampered, wrong secret) — reject without leaking
    // the precise reason. The epoch check is below; same "INVALID_SESSION" shape.
    res
      .status(401)
      .json({ code: "INVALID_SESSION", message: "Invalid session" });
    return;
  }

  // Epoch check: the user may have rotated their epoch (logout-all, password reset).
  // If so, even a cryptographically-valid token is dead.
  // We tolerate `payload.epoch` being undefined (for legacy tokens) by treating it as 1
  // — the initial epoch. Once the first bump happens, those legacy tokens fail.
  const tokenEpoch = payload.epoch ?? 1;
  const user = await usersRepo.findById(payload.sub);
  if (!user) {
    // User deleted while their session was live — reject. Distinct from the /me handler's
    // "user no longer exists" path, which checks AFTER preHandler succeeds. Reaching here
    // means the JWT was valid AND signed by us, but the row is gone — treat as logged out.
    res
      .status(401)
      .json({ code: "INVALID_SESSION", message: "Invalid session" });
    return;
  }
  const userEpoch = user.jwtEpoch ?? 1;
  if (tokenEpoch < userEpoch) {
    res
      .status(401)
      .json({ code: "INVALID_SESSION", message: "Invalid session" });
    return;
  }

  req.userId = payload.sub;
  next();
}
