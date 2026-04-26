/**
 * Express application factory.
 *
 * Returns a configured but un-listened Express app so tests can drive it through
 * supertest without opening a socket. Mirrors the Fastify-era contract of `buildApp()`
 * minus the framework-specific Reply/Hook surface.
 *
 * Middleware order matters and is fixed here:
 *   1. pino-http  — request logger; attaches `req.log` for downstream handlers
 *   2. cors       — must run before body parsing so OPTIONS preflights short-circuit
 *   3. express.json — body parser; bumped to 10 MB for résumé uploads (base64-encoded
 *                     PDFs and DOCX can run hot)
 *   4. cookie-parser — populates req.cookies from the Cookie header
 *   5. routes (health, auth, sessions) — each mounts under /api/*
 *   6. 404 handler — anything that fell through to here is a wrong path
 *   7. error handler — single funnel for thrown / next(err) errors
 */

import express, { type Application, type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import pinoHttp from "pino-http";
import pino from "pino";
import { env } from "@/config/env";
import { ensureIndexes } from "@/db/indexes";
import { authRoutes } from "@/modules/auth/auth.routes";
import { dashboardRoutes } from "@/modules/dashboard/dashboard.routes";
import { healthRoutes } from "@/modules/health/health.routes";
import { sessionRoutes } from "@/modules/sessions/sessions.routes";

// Single shared logger instance. Disabled in tests to keep Jest output clean.
// pino-http wraps this and attaches `req.log` to every request.
const logger = pino({
  enabled: env.NODE_ENV !== "test",
  level: env.NODE_ENV === "production" ? "info" : "debug",
});

export async function buildApp(): Promise<Application> {
  const app = express();

  // Behind a load balancer the cookie's Secure flag depends on detecting HTTPS, and
  // express-rate-limit needs trust-proxy to read the real client IP from X-Forwarded-For.
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    pinoHttp({
      logger,
      // Don't log every health check — fills logs with noise in deployments behind probes.
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
    }),
  );

  // `credentials: true` + cookie auth REQUIRES an explicit origin — "*" is rejected by
  // browsers when cookies are attached. Split comma-separated list to allow staging +
  // prod together. Same behaviour as the Fastify-era cors registration.
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );

  // 10 MB is comfortably above any realistic résumé/JD payload (a base64-encoded 5 MB PDF
  // is ~7 MB on the wire). Tighter caps risk legitimate uploads being rejected.
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  // Idempotent — Mongo's createIndex returns early when the index already exists.
  await ensureIndexes();

  // Routes mount themselves on the app. Each module exports a function that accepts the
  // Express app and registers its routes — keeps route wiring out of this file's concern.
  healthRoutes(app);
  authRoutes(app);
  sessionRoutes(app);
  dashboardRoutes(app);

  // Catch-all 404 for any path the routers didn't claim. Returns the project-wide
  // {code, message} shape so the FE can branch consistently.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ code: "NOT_FOUND", message: "Route not found" });
  });

  // Single error funnel. All thrown errors and next(err) calls land here. We never leak
  // stack traces to the client; the pino logger captures them server-side.
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    req.log.error({ err }, "unhandled request error");
    if (res.headersSent) return; // already wrote a response — let Express finish
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  });

  return app;
}
