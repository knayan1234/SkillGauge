import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export const COOKIE_NAME = "skillgauge_session";

interface SessionPayload {
  sub: string; // user id
}

declare module "fastify" {
  interface FastifyRequest {
    // Populated by requireAuth; absent on public routes.
    userId?: string;
  }
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies SessionPayload, env.JWT_SECRET, {
    expiresIn: `${env.JWT_TTL_DAYS}d`,
  });
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

// Route-level guard. Use as `preHandler: requireAuth` on any handler that needs `request.userId`.
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
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
    request.userId = payload.sub;
  } catch {
    // Any verification failure (expired, tampered, wrong secret) → 401, never 500. We don't
    // leak which failure mode — an attacker doesn't need a hint.
    reply
      .code(401)
      .send({ code: "INVALID_SESSION", message: "Invalid session" });
  }
}

// No-op registration — keeps the plugin pattern available if we later add decorators.
export async function authPlugin(_app: FastifyInstance): Promise<void> {
  // Placeholder; auth state lives on FastifyRequest via module augmentation above.
}
