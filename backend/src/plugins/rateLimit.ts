/**
 * Per-IP rate limit for authentication routes.
 *
 * Why a separate plugin file (not just `app.use(rateLimit(...))` inline in app.ts)?
 *   - app.ts stays at the "compose middleware" layer of detail. Per-route policy (which
 *     paths are limited, how many requests per window, what the 429 body looks like)
 *     lives here as a single concern.
 *   - express-rate-limit is composed per-route, not globally. We export a factory so
 *     auth.routes.ts can attach the same limiter to login + reset-request — but NOT to
 *     register, /me, /logout, etc.
 *
 * Storage backend: in-process MemoryStore (default). Trade-offs:
 *   - Pros: zero infra dependency, fast, no Mongo round-trip per request.
 *   - Cons: counts reset on process restart; if we scale to multiple BE instances each
 *     instance has its own counter (a determined attacker could rotate across N
 *     instances to multiply the cap N-fold).
 *   - For a single BE process behind a single LB this is fine.
 *   - To swap to Redis (rate-limit-redis) when we deploy multi-instance — Atlas is
 *     fine but adds latency vs in-process.
 */

import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { env } from "@/config/env";

// Routes that get the per-IP cap. Centralized list so ops can audit at a glance which
// endpoints are "hot" auth surfaces. Covers login + reset-request — register is
// intentionally NOT capped because legit users may sign up multiple accounts in dev,
// and register has a 409 EMAIL_TAKEN escape hatch that already throttles abuse.
export const RATE_LIMITED_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/password/reset-request",
] as const;

/**
 * Builds the per-IP limiter middleware. Call once and attach the returned handler to
 * each route that needs the cap. Sharing a single instance across routes means counts
 * are tracked together — an attacker can't trivially split traffic between login and
 * reset-request to double their effective cap.
 */
export function buildAuthRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: env.AUTH_RATE_PER_MIN,
    // Disable the express-rate-limit standard headers — we ship our own {code, message}
    // body in the 429 response and the headers add noise without value here.
    standardHeaders: false,
    legacyHeaders: false,
    // 429 response body matches our project-wide {code, message} contract.
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode ?? 429).json({
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Try again in ${Math.ceil(options.windowMs / 1000)}s.`,
      });
    },
  });
}
