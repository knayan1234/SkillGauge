/**
 * Routes for the interview-session lifecycle.
 *
 * Schemas come from `@/shared/contracts` (single source of truth) and every error
 * response uses the project-wide `{code, message}` shape. The error codes here let
 * the FE branch on machine-readable identifiers instead of parsing strings:
 *   - INVALID_FORMAT             (400) — zod parse failure on body or :index path param
 *   - RESUME_PARSE_FAILED        (400) — uploaded resume bytes couldn't be decoded
 *   - UNSUPPORTED_RESUME_MIME    (415) — resume MIME isn't one we can parse
 *   - SESSION_NOT_FOUND          (404) — id doesn't resolve to a session, or its current
 *                                        question slot is missing (corrupt state)
 *   - SESSION_FORBIDDEN          (403) — session belongs to another user
 *   - SESSION_COMPLETED          (409) — caller tried to submit an answer after isComplete
 *   - SESSION_INDEX_MISMATCH     (409) — caller asked for question N but session is on M
 *   - QUOTA_EXCEEDED             (402) — daily per-user token quota reached
 *   - INPUT_TOO_LARGE            (413) — single LLM call's input exceeded MAX_INPUT_CHARS
 */

import {
  Router,
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { requireAuth } from "@/plugins/auth";
import { answerSchema, initSessionSchema } from "@/shared/contracts";
import { SessionError, sessionsService } from "./sessions.service";

// Same wrap helper used in auth.routes.ts. Express 5 supports Promise rejection
// natively, but wrapping makes intent obvious and tolerates synchronous throws too.
type AsyncHandler = (req: Request, res: Response) => Promise<void | Response>;
const wrap =
  (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

export function sessionRoutes(app: Application): void {
  const router = Router();

  // Every session route requires auth — apply at the router level so a missed
  // middleware on a single route can't accidentally expose data.
  router.use(requireAuth);

  // List the current user's sessions newest-first. Replaces the localStorage archive
  // for authenticated users; the FE sidebar queries this and falls back to the local
  // archive only when offline / 401.
  router.get(
    "/",
    wrap(async (req, res) => {
      const sessions = await sessionsService.listSessions(req.userId!);
      res.json({ sessions });
    }),
  );

  // Hydrate a session's full transcript. Used to "open" a past session from the
  // sidebar — the FE replays the messages array into MessageBubbles in order.
  router.get(
    "/:id/messages",
    wrap(async (req, res) => {
      const { id } = req.params as { id: string };
      try {
        const messages = await sessionsService.listMessages(req.userId!, id);
        res.json({ messages });
      } catch (err) {
        if (err instanceof SessionError) {
          res
            .status(statusForSessionError(err.code))
            .json({
              code: codeForSessionError(err.code),
              message: err.message,
            });
          return;
        }
        throw err;
      }
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      const parsed = initSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid session request",
        });
        return;
      }
      try {
        const result = await sessionsService.initialize(
          req.userId!,
          parsed.data,
        );
        res.status(201).json(result);
      } catch (err) {
        if (err instanceof SessionError) {
          res
            .status(statusForSessionError(err.code))
            .json({
              code: codeForSessionError(err.code),
              message: err.message,
            });
          return;
        }
        throw err;
      }
    }),
  );

  router.get(
    "/:id/questions/:index",
    wrap(async (req, res) => {
      // Express 5 widens req.params values to `string | string[]` to accommodate the
      // new wildcard matcher (`*` / `**`). Our paths only use single-segment `:name`
      // captures, which always resolve to `string`, so we narrow once here.
      const { id, index: indexParam } = req.params as {
        id: string;
        index: string;
      };
      const index = Number.parseInt(indexParam, 10);
      if (!Number.isInteger(index) || index < 0) {
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid question index",
        });
        return;
      }
      try {
        const msg = await sessionsService.getQuestion(req.userId!, id, index);
        res.json(msg);
      } catch (err) {
        if (err instanceof SessionError) {
          res
            .status(statusForSessionError(err.code))
            .json({
              code: codeForSessionError(err.code),
              message: err.message,
            });
          return;
        }
        throw err;
      }
    }),
  );

  // Re-answer a past question. Body: { answer: string }. Returns { answerMsg, feedback }.
  // Doesn't advance the session — the original Q/A/F row stays; the retry appends
  // new answer + feedback rows at the end of the transcript.
  router.post(
    "/:id/questions/:index/reanswer",
    wrap(async (req, res) => {
      const { id, index: indexParam } = req.params as {
        id: string;
        index: string;
      };
      const index = Number.parseInt(indexParam, 10);
      if (!Number.isInteger(index) || index < 0) {
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid question index",
        });
        return;
      }
      const parsed = answerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid answer payload",
        });
        return;
      }
      try {
        const result = await sessionsService.reanswer(
          req.userId!,
          id,
          index,
          parsed.data.answer,
        );
        res.json(result);
      } catch (err) {
        if (err instanceof SessionError) {
          res
            .status(statusForSessionError(err.code))
            .json({
              code: codeForSessionError(err.code),
              message: err.message,
            });
          return;
        }
        throw err;
      }
    }),
  );

  router.post(
    "/:id/rounds/next",
    wrap(async (req, res) => {
      const { id } = req.params as { id: string };
      try {
        const result = await sessionsService.nextRound(req.userId!, id);
        res.status(201).json(result);
      } catch (err) {
        if (err instanceof SessionError) {
          res
            .status(statusForSessionError(err.code))
            .json({
              code: codeForSessionError(err.code),
              message: err.message,
            });
          return;
        }
        throw err;
      }
    }),
  );

  // Delete a session — cascades to its messages + memories. Returns 204 on success.
  // Idempotent: a second call after success returns 404 SESSION_NOT_FOUND.
  router.delete(
    "/:id",
    wrap(async (req, res) => {
      const { id } = req.params as { id: string };
      try {
        await sessionsService.deleteSession(req.userId!, id);
        res.status(204).send();
      } catch (err) {
        if (err instanceof SessionError) {
          res
            .status(statusForSessionError(err.code))
            .json({
              code: codeForSessionError(err.code),
              message: err.message,
            });
          return;
        }
        throw err;
      }
    }),
  );

  router.post(
    "/:id/answers",
    wrap(async (req, res) => {
      const { id } = req.params as { id: string };
      const parsed = answerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "INVALID_FORMAT",
          message: "Invalid answer payload",
        });
        return;
      }
      try {
        const result = await sessionsService.submitAnswer(
          req.userId!,
          id,
          parsed.data.answer,
        );
        res.json(result);
      } catch (err) {
        if (err instanceof SessionError) {
          res
            .status(statusForSessionError(err.code))
            .json({
              code: codeForSessionError(err.code),
              message: err.message,
            });
          return;
        }
        throw err;
      }
    }),
  );

  app.use("/api/sessions", router);
}

// HTTP status by SessionError code. Centralized so future codes slot in here, not in
// scattered ternaries across two routes.
function statusForSessionError(code: SessionError["code"]): number {
  switch (code) {
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "ALREADY_COMPLETE":
    case "INDEX_MISMATCH":
    case "NOT_COMPLETE":
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
    case "NOT_COMPLETE":
      return "ROUND_NOT_COMPLETE";
  }
}
