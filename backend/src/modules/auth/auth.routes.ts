import type { FastifyInstance } from "fastify";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signSessionToken,
} from "@/plugins/auth";
import { hashEmailForLog } from "@/shared/audit";
import { credentialsSchema } from "./auth.schema";
import { AuthError, authService } from "./auth.service";

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
      const user = await authService.register(
        parsed.data.email,
        parsed.data.password,
      );
      setSessionCookie(reply, signSessionToken(user.id));
      return reply.code(201).send({ user });
    } catch (err) {
      if (err instanceof AuthError && err.code === "EMAIL_TAKEN") {
        return reply.code(409).send({ code: err.code, message: err.message });
      }
      throw err;
    }
  });

  app.post("/api/auth/login", async (request, reply) => {
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
      const user = await authService.login(
        parsed.data.email,
        parsed.data.password,
      );
      setSessionCookie(reply, signSessionToken(user.id));
      return reply.send({ user });
    } catch (err) {
      if (err instanceof AuthError) {
        // Audit log: hashed email + IP + reason. Never the raw email or password. Phase 1.5c
        // will count these per (ip, emailHash) for rate limiting + soft lockout.
        request.log.warn(
          {
            event: "auth.login.failed",
            ip: request.ip,
            emailHash: hashEmailForLog(parsed.data.email),
            reason: err.code,
          },
          "login failed",
        );
        return reply.code(401).send({ code: err.code, message: err.message });
      }
      throw err;
    }
  });

  // Logout is public — hitting it without a cookie is still a valid no-op (clears nothing).
  app.post("/api/auth/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.code(204).send();
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
