import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { ensureIndexes } from "@/db/indexes";
import { authRoutes } from "@/modules/auth/auth.routes";
import { healthRoutes } from "@/modules/health/health.routes";
import { sessionRoutes } from "@/modules/sessions/sessions.routes";
import { registerRateLimit } from "@/plugins/rateLimit";

// buildApp returns an un-listened Fastify instance. Keep bootstrap separate from listen() so
// tests can call `app.inject(...)` without opening a socket.
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
    // Trust proxy: behind a load balancer the Set-Cookie's Secure flag depends on detecting HTTPS.
    trustProxy: env.NODE_ENV === "production",
  });

  await app.register(cookie);
  await app.register(cors, {
    // `credentials: true` + cookie auth REQUIRES an explicit origin — "*" is rejected by browsers
    // when cookies are attached. Split comma-separated list to allow staging + prod together.
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });

  // Phase 1.5c — per-IP rate limiter. Registered globally with `global: false` so each
  // route opts in via `config.rateLimit`. See backend/src/plugins/rateLimit.ts.
  await registerRateLimit(app);

  // Idempotent — Mongo's createIndex returns early when the index already exists.
  await ensureIndexes();

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(sessionRoutes);

  return app;
}
