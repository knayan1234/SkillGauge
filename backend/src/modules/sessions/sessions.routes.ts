/**
 * Routes for the interview-session lifecycle.
 *
 * Schemas come from `@/shared/contracts` (single source of truth) and every error
 * response uses the project-wide `{code, message}` shape. The error codes here let
 * the FE branch on machine-readable identifiers instead of parsing strings:
 *   - INVALID_FORMAT             (400) — zod parse failure on body or :index path param
 *   - RESUME_PARSE_FAILED        (400) — uploaded résumé bytes couldn't be decoded
 *   - UNSUPPORTED_RESUME_MIME    (415) — résumé MIME isn't one we can parse
 *   - SESSION_NOT_FOUND          (404) — id doesn't resolve to a session, or its current
 *                                        question slot is missing (corrupt state)
 *   - SESSION_FORBIDDEN          (403) — session belongs to another user
 *   - SESSION_COMPLETED          (409) — caller tried to submit an answer after isComplete
 *   - SESSION_INDEX_MISMATCH     (409) — caller asked for question N but session is on M
 *   - QUOTA_EXCEEDED             (402) — daily per-user token quota reached
 *   - INPUT_TOO_LARGE            (413) — single LLM call's input exceeded MAX_INPUT_CHARS
 */

import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/plugins/auth";
import { answerSchema, initSessionSchema } from "@/shared/contracts";
import { SessionError, sessionsService } from "./sessions.service";

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // Every session route requires auth — apply the hook at the route level so a missed
  // decorator on a single route can't accidentally expose data.
  app.addHook("preHandler", requireAuth);

  app.post("/api/sessions", async (request, reply) => {
    const parsed = initSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        code: "INVALID_FORMAT",
        message: "Invalid session request",
      });
    }
    try {
      const result = await sessionsService.initialize(
        request.userId!,
        parsed.data,
      );
      return reply.code(201).send(result);
    } catch (err) {
      if (err instanceof SessionError) {
        return reply
          .code(statusForSessionError(err.code))
          .send({ code: codeForSessionError(err.code), message: err.message });
      }
      throw err;
    }
  });

  app.get<{ Params: { id: string; index: string } }>(
    "/api/sessions/:id/questions/:index",
    async (request, reply) => {
      const index = Number.parseInt(request.params.index, 10);
      if (!Number.isInteger(index) || index < 0) {
        return reply.code(400).send({
          code: "INVALID_FORMAT",
          message: "Invalid question index",
        });
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
            .code(statusForSessionError(err.code))
            .send({ code: codeForSessionError(err.code), message: err.message });
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
        return reply.code(400).send({
          code: "INVALID_FORMAT",
          message: "Invalid answer payload",
        });
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
          return reply
            .code(statusForSessionError(err.code))
            .send({ code: codeForSessionError(err.code), message: err.message });
        }
        throw err;
      }
    },
  );
}

// HTTP status by SessionError code. Centralized so future code adds slot in here, not
// in scattered ternaries across two routes.
function statusForSessionError(code: SessionError["code"]): number {
  switch (code) {
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "ALREADY_COMPLETE":
    case "INDEX_MISMATCH":
      return 409;
    case "RESUME_PARSE_FAILED":
      return 400;
    case "UNSUPPORTED_RESUME_MIME":
      // 415 Unsupported Media Type — semantically right; lets the FE branch and
      // surface "your file format isn't supported" rather than a generic 400.
      return 415;
    case "QUOTA_EXCEEDED":
      // 402 Payment Required — semantically right for "you've used your allowance."
      return 402;
    case "INPUT_TOO_LARGE":
      return 413;
  }
}

// Wire-level code by SessionError code. Internal codes ("FORBIDDEN") get a more
// descriptive wire name ("SESSION_FORBIDDEN") so a FE consumer reading just the code
// knows the surface without context. Future contracts.ts could lift this map but the
// surface is small enough that inline here is the simpler choice today.
function codeForSessionError(code: SessionError["code"]): string {
  switch (code) {
    case "NOT_FOUND":
      return "SESSION_NOT_FOUND";
    case "FORBIDDEN":
      return "SESSION_FORBIDDEN";
    case "ALREADY_COMPLETE":
      return "SESSION_COMPLETED";
    case "INDEX_MISMATCH":
      return "SESSION_INDEX_MISMATCH";
    case "RESUME_PARSE_FAILED":
      return "RESUME_PARSE_FAILED";
    case "UNSUPPORTED_RESUME_MIME":
      return "UNSUPPORTED_RESUME_MIME";
    case "QUOTA_EXCEEDED":
      return "QUOTA_EXCEEDED";
    case "INPUT_TOO_LARGE":
      return "INPUT_TOO_LARGE";
  }
}
