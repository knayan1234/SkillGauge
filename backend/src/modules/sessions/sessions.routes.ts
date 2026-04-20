import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/plugins/auth";
import { answerSchema, initSessionSchema } from "./sessions.schema";
import { SessionError, sessionsService } from "./sessions.service";

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // Every session route requires auth — apply the hook at the route level so
  // a missed decorator can't accidentally expose data.
  app.addHook("preHandler", requireAuth);

  app.post("/api/sessions", async (request, reply) => {
    const parsed = initSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid session request", details: parsed.error.issues });
    }
    const result = await sessionsService.initialize(
      request.userId!,
      parsed.data,
    );
    return reply.code(201).send(result);
  });

  app.get<{ Params: { id: string; index: string } }>(
    "/api/sessions/:id/questions/:index",
    async (request, reply) => {
      const index = Number.parseInt(request.params.index, 10);
      if (!Number.isInteger(index) || index < 0) {
        return reply.code(400).send({ error: "Invalid question index" });
      }
      try {
        const msg = await sessionsService.getQuestion(
          request.userId!,
          request.params.id,
          index,
        );
        return reply.send(msg);
      } catch (err) {
        if (err instanceof SessionError) {
          return reply
            .code(err.code === "FORBIDDEN" ? 403 : 404)
            .send({ error: err.message });
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/sessions/:id/answers",
    async (request, reply) => {
      const parsed = answerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid answer payload" });
      }
      try {
        const result = await sessionsService.submitAnswer(
          request.userId!,
          request.params.id,
          parsed.data.answer,
        );
        return reply.send(result);
      } catch (err) {
        if (err instanceof SessionError) {
          const status =
            err.code === "FORBIDDEN"
              ? 403
              : err.code === "ALREADY_COMPLETE" || err.code === "INDEX_MISMATCH"
                ? 409
                : 404;
          return reply.code(status).send({ error: err.message });
        }
        throw err;
      }
    },
  );
}
