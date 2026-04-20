import type { FastifyInstance } from "fastify";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signSessionToken,
} from "@/plugins/auth";
import { credentialsSchema } from "./auth.schema";
import { AuthError, authService } from "./auth.service";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/auth/register", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid credentials format" });
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
        return reply.code(409).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid credentials format" });
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
        return reply.code(401).send({ error: err.message });
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
        return reply.code(401).send({ error: "User no longer exists" });
      }
      return reply.send({ user });
    },
  );
}
