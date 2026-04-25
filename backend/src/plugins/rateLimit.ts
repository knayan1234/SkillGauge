/**
 * Per-IP rate limit for authentication routes (Phase 1.5c).
 *
 * Why a separate plugin file (not just `app.register(rateLimit, ...)` inline in app.ts)?
 *   - app.ts stays at the "compose plugins" layer of detail. Per-route policy (which
 *     paths are limited, how many requests per window, what the 429 body looks like)
 *     lives here as a single concern.
 *   - The `@fastify/rate-limit` plugin can be registered globally OR per-route. We use
 *     per-route via `config.rateLimit` so the cap only fires on /api/auth/login and
 *     /api/auth/password/reset-request — not on /api/me, /api/sessions, etc.
 *
 * Storage backend: in-process LRU (default). Trade-offs:
 *   - Pros: zero infra dependency, fast, no Mongo round-trip per request.
 *   - Cons: counts reset on process restart; if we scale to multiple BE instances each
 *     instance has its own counter (a determined attacker could rotate across N
 *     instances to multiply the cap N-fold).
 *   - For Phase 1 (single BE process behind a single LB) this is fine.
 *   - TODO:phase-4 swap to a Redis backend (`@fastify/rate-limit` supports it natively)
 *     when we deploy multi-instance — Atlas is fine but adds latency vs in-process.
 *
 * Bypass for tests: AUTH_RATE_PER_MIN can be overridden via env to a huge number, or the
 * plugin can be skipped entirely. We keep it ON by default in tests to verify the wiring.
 */

import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { env } from "@/config/env";

// Routes that get the per-IP cap. Centralized list so ops can audit at a glance which
// endpoints are "hot" auth surfaces. Phase 1.5c covers login + reset-request — register
// is intentionally NOT capped because legit users may sign up multiple accounts in dev,
// and register has a 409 EMAIL_TAKEN escape hatch that already throttles abuse.
export const RATE_LIMITED_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/password/reset-request",
] as const;

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  // The plugin is registered globally (so it's available for any route to opt into)
  // but with `global: false` — opt-in only. Per-route opt-in happens via the
  // `config.rateLimit` object on each route registration in auth.routes.ts.
  await app.register(rateLimit, {
    global: false,
    max: env.AUTH_RATE_PER_MIN,
    timeWindow: "1 minute",
    // 429 response body matches our project-wide {code, message} contract.
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message: `Too many requests. Try again in ${ctx.after}.`,
    }),
  });
}
