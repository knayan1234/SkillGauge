import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { sessionsRepo, type SessionDoc } from "@/db/repos/sessions";
import { messagesRepo, type MessageDoc } from "@/db/repos/messages";
import {
  memoriesRepo,
  type MemoryDoc,
  type MemoryKind,
} from "@/db/repos/memories";
import { usageQuotasRepo } from "@/db/repos/usageQuotas";
import { createLLMClient } from "@/llm/index";
import { getEmbeddingsClient } from "@/llm/embeddings";
import { PROMPT_VERSION } from "@/llm/prompts/v1";
import type { Session, Message, SessionInitRequest } from "@/shared/types";
import { parseResume, ResumeParseError } from "./ingest";

export class SessionError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "ALREADY_COMPLETE"
      | "INDEX_MISMATCH"
      // Resume parsing failure — surfaced from sessions.routes as 400 RESUME_PARSE_FAILED
      // / 415 UNSUPPORTED_MIME so the FE can show a specific "we couldn't read your
      // resume" message instead of a generic error.
      | "RESUME_PARSE_FAILED"
      | "UNSUPPORTED_RESUME_MIME"
      // Cost guards. QUOTA_EXCEEDED → 402 Payment Required (semantically right for
      // "you've used your daily allowance"); INPUT_TOO_LARGE → 413 Payload Too Large
      // for inputs that would burn budget without producing signal.
      | "QUOTA_EXCEEDED"
      | "INPUT_TOO_LARGE"
      // Round chaining. NOT_COMPLETE → caller asked for the next round before the
      // current one finished; surfaced as 409 Conflict at the route layer.
      | "NOT_COMPLETE",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Pre-LLM-call guard. Throws SessionError on either guard failure so the route
 * layer maps it to the right wire-level code + status.
 *
 * Daily-token check uses today's UTC quota doc (auto-created on first use). The
 * input-length check is a flat character cap on whatever we're about to feed the
 * LLM — concatenated resume + JD + answer history + the rendered prompt.
 */
async function ensureUnderQuotaAndLength(
  userId: string,
  inputChars: number,
): Promise<void> {
  if (inputChars > env.MAX_INPUT_CHARS) {
    throw new SessionError(
      "INPUT_TOO_LARGE",
      `Input exceeds the per-call cap of ${env.MAX_INPUT_CHARS} characters. Trim your resume or answer.`,
    );
  }
  const used = await usageQuotasRepo.getCurrentTokens(userId);
  if (used >= env.DAILY_TOKEN_LIMIT) {
    throw new SessionError(
      "QUOTA_EXCEEDED",
      `Daily token quota of ${env.DAILY_TOKEN_LIMIT} reached. Quota resets at UTC midnight.`,
    );
  }
}

/**
 * Estimated tokens for a string. Rough heuristic — ~4 chars per token for English text
 * across both OpenAI and Anthropic tokenisers. Real adapters should prefer the usage
 * counts from the provider's response when available; this is the fallback for the
 * stub (which has no token counts) and for accounting before the LLM call returns.
 */
function estimateTokens(...strings: string[]): number {
  const chars = strings.reduce((sum, s) => sum + s.length, 0);
  return Math.ceil(chars / 4);
}

const llm = createLLMClient();
// Embeddings client used for the long-term memory store. Lazy via the factory's cache;
// the factory throws if EMBEDDINGS_PROVIDER selects a real provider without its key.
// On stub-mode the vectors are deterministic but semantically meaningless — the storage
// path runs end-to-end so consumers don't have to branch.
const embeddings = getEmbeddingsClient();

/**
 * Best-effort write of a single memory row. Embedding failures (provider down,
 * network blip) are logged and swallowed so a transient embedding outage doesn't
 * break the chat flow — the answer/feedback still persists in `messages`. The
 * memory layer is augmentation, not load-bearing for the interview itself.
 */
async function writeMemory(params: {
  userId: string;
  sessionId: string;
  messageId?: string;
  kind: MemoryKind;
  content: string;
  score?: number;
}): Promise<void> {
  try {
    const vector = await embeddings.embed(params.content);
    const doc: MemoryDoc = {
      _id: randomUUID(),
      userId: params.userId,
      sessionId: params.sessionId,
      messageId: params.messageId,
      kind: params.kind,
      content: params.content,
      embedding: vector,
      score: params.score,
      createdAt: new Date(),
    };
    await memoriesRepo.insert(doc);
  } catch (err) {
    // Don't propagate. Worst case we lose retrieval value for one row; the chat
    // continues. Logged at warn so a recurring failure shows up in observability
    // without polluting normal logs.
    // eslint-disable-next-line no-console
    console.warn("[memories] write failed:", err);
  }
}

function toApiSession(doc: SessionDoc): Session {
  return {
    id: doc._id,
    title: doc.title,
    currentQuestionIndex: doc.currentQuestionIndex,
    totalQuestions: doc.totalQuestions,
    status: doc.status,
    createdAt: doc.createdAt,
    // Parsed plain text. Cheap to include — the FE displays it in the resume
    // preview dialog without having to fetch a second endpoint.
    resumeContent: doc.resumeContent,
    resumeFileName: doc.resumeFileName,
    // Round-chaining state. Both default to legacy values (1 / totalQuestions) for
    // sessions created before the field existed.
    currentRound: doc.currentRound ?? 1,
    questionsPerRound: doc.questionsPerRound ?? doc.totalQuestions,
  };
}

function toApiMessage(doc: MessageDoc): Message {
  return {
    id: doc._id,
    type: doc.type,
    content: doc.content,
    timestamp: doc.createdAt,
    feedback: doc.feedback,
  };
}

// Pull options back into LLMClient context shape — session doc stores them flat.
// `currentRound` defaults to 1 for legacy docs (pre-round-chaining sessions); the prompt
// only applies round-2+ framing when round > 1. `interviewerPersona` defaults to
// `neutral` (empty prompt addition) for legacy / unset rows.
function ctxFromSession(
  doc: SessionDoc,
  questionIndex: number,
  previousMessages: ReadonlyArray<{
    type: MessageDoc["type"];
    content: string;
  }>,
  pastQuestionsForResume: ReadonlyArray<string> = [],
) {
  return {
    questionIndex,
    totalQuestions: doc.totalQuestions,
    resumeContent: doc.resumeContent,
    jobDescription: doc.jobDescription,
    interviewStyle: doc.interviewStyle,
    difficulty: doc.difficulty,
    roleLevel: doc.roleLevel,
    focusAreas: doc.focusAreas,
    currentRound: doc.currentRound ?? 1,
    interviewerPersona: doc.interviewerPersona ?? "neutral",
    previousMessages,
    pastQuestionsForResume,
  };
}

/**
 * Load every question this user has ever been asked on the same resume (across all
 * past sessions). Backs the "no repeats" guard in the question generator: the prompt
 * renderer pipes this list in as a "do not repeat" instruction. Best-effort: a query
 * failure returns an empty list rather than blocking the chat path — non-repetition
 * is augmentation, not load-bearing.
 */
async function loadPastQuestionsForResume(
  userId: string,
  resumeFileName: string,
): Promise<string[]> {
  try {
    const rows = await messagesRepo.findQuestionsByResume(
      userId,
      resumeFileName,
    );
    return rows.map((r) => r.content);
  } catch {
    return [];
  }
}

// Owner-check + fetch in one place so routes can't forget it.
async function loadOwnedSession(
  sessionId: string,
  userId: string,
): Promise<SessionDoc> {
  const doc = await sessionsRepo.findById(sessionId);
  if (!doc) throw new SessionError("NOT_FOUND", "Session not found");
  if (doc.userId !== userId) {
    // Returning 404-equivalent (not 403) would hide existence, but we'd rather the FE log
    // "forbidden" when it finds a stale session id belonging to someone else after a logout.
    throw new SessionError("FORBIDDEN", "Session belongs to another user");
  }
  return doc;
}

function titleFor(request: SessionInitRequest): string {
  const styleLabel =
    request.interviewStyle === "behavioral"
      ? "Behavioral"
      : request.interviewStyle === "technical"
        ? "Technical"
        : "Mixed";
  const roleLabel =
    request.roleLevel[0].toUpperCase() + request.roleLevel.slice(1);
  return `${roleLabel} ${styleLabel} Interview`;
}

export const sessionsService = {
  async initialize(
    userId: string,
    request: SessionInitRequest,
  ): Promise<{ session: Session; firstQuestion: Message }> {
    // Parse the uploaded resume up front so the persisted resumeContent is the EXTRACTED
    // PLAIN TEXT, not raw base64 bytes. Downstream consumers (LLM prompts, sidebar
    // preview dialog) can rely on it being human-readable text without re-parsing.
    let parsedResume: string;
    try {
      parsedResume = await parseResume({
        contentBase64: request.resumeContent,
        mime: request.resumeMime,
        fileName: request.resumeFileName,
      });
    } catch (err) {
      if (err instanceof ResumeParseError) {
        const code =
          err.code === "UNSUPPORTED_MIME"
            ? "UNSUPPORTED_RESUME_MIME"
            : "RESUME_PARSE_FAILED";
        throw new SessionError(code, err.message);
      }
      throw err;
    }

    const now = new Date().toISOString();
    const sessionDoc: SessionDoc = {
      _id: randomUUID(),
      userId,
      title: titleFor(request),
      currentQuestionIndex: 0,
      totalQuestions: request.questionCount,
      status: "active",
      resumeFileName: request.resumeFileName,
      resumeContent: parsedResume,
      jobDescription: request.jobDescription,
      interviewStyle: request.interviewStyle,
      difficulty: request.difficulty,
      roleLevel: request.roleLevel,
      focusAreas: request.focusAreas,
      // Persona defaults to `neutral` — empty prompt addition, identical behaviour
      // to pre-Phase-10 sessions.
      interviewerPersona: request.interviewerPersona ?? "neutral",
      createdAt: now,
      // Round-chaining (option B). Round 1 starts at session creation; bumps via
      // `nextRound()` when the user clicks "Start next round" after completing the
      // current one. `questionsPerRound` is captured from the original `questionCount`
      // so future rounds extend `totalQuestions` by the same chunk size.
      currentRound: 1,
      questionsPerRound: request.questionCount,
    };
    await sessionsRepo.create(sessionDoc);

    // Cost guards before the first LLM call. Input length = resume + JD only; the
    // history is empty on initialise.
    await ensureUnderQuotaAndLength(
      userId,
      sessionDoc.resumeContent.length + sessionDoc.jobDescription.length,
    );
    const pastQuestions = await loadPastQuestionsForResume(
      userId,
      sessionDoc.resumeFileName,
    );
    const firstContent = await llm.generateQuestion(
      ctxFromSession(sessionDoc, 0, [], pastQuestions),
    );
    // Account for tokens. Stub returns no usage data; estimate from input + output.
    await usageQuotasRepo.recordCall(
      userId,
      estimateTokens(
        sessionDoc.resumeContent,
        sessionDoc.jobDescription,
        firstContent,
      ),
    );
    const firstDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId: sessionDoc._id,
      type: "question",
      content: firstContent,
      questionIndex: 0,
      promptVersion: PROMPT_VERSION,
      createdAt: new Date().toISOString(),
    };
    await messagesRepo.create(firstDoc);

    // Memory writes — index the resume + JD once per session (they're the anchor
    // context for everything that follows). Question rows are optional from a
    // retrieval standpoint but indexing them gives the dashboard a complete record.
    // All writes are best-effort — failures log + swallow so the chat flow never
    // breaks on an embeddings hiccup.
    // Fire-and-forget: the memory/vector store is augmentation, not load-bearing for the
    // response, so we don't block the (already slow) LLM round-trip on embedding writes.
    // writeMemory swallows its own errors, so this Promise.all can never reject.
    void Promise.all([
      writeMemory({
        userId,
        sessionId: sessionDoc._id,
        kind: "resume",
        content: sessionDoc.resumeContent,
      }),
      writeMemory({
        userId,
        sessionId: sessionDoc._id,
        kind: "jd",
        content: sessionDoc.jobDescription,
      }),
      writeMemory({
        userId,
        sessionId: sessionDoc._id,
        messageId: firstDoc._id,
        kind: "question",
        content: firstContent,
      }),
    ]);

    return {
      session: toApiSession(sessionDoc),
      firstQuestion: toApiMessage(firstDoc),
    };
  },

  // Idempotent: if the Nth question already exists, return it instead of regenerating.
  // Lets the FE re-mount/refresh without burning LLM budget.
  async getQuestion(
    userId: string,
    sessionId: string,
    index: number,
  ): Promise<Message> {
    const sessionDoc = await loadOwnedSession(sessionId, userId);
    const existing = await messagesRepo.findQuestionByIndex(sessionId, index);
    if (existing) return toApiMessage(existing);

    if (index !== sessionDoc.currentQuestionIndex) {
      throw new SessionError(
        "INDEX_MISMATCH",
        `Cannot jump to question ${index}; current is ${sessionDoc.currentQuestionIndex}`,
      );
    }
    const previousMessages = (await messagesRepo.listBySession(sessionId)).map(
      (m) => ({ type: m.type, content: m.content }),
    );
    // Cost guards. Input length sums resume + JD + concatenated message history so
    // a runaway transcript can't blow past the per-call cap.
    const historyChars = previousMessages.reduce(
      (sum, m) => sum + m.content.length,
      0,
    );
    await ensureUnderQuotaAndLength(
      userId,
      sessionDoc.resumeContent.length +
        sessionDoc.jobDescription.length +
        historyChars,
    );
    const pastQuestions = await loadPastQuestionsForResume(
      userId,
      sessionDoc.resumeFileName,
    );
    const content = await llm.generateQuestion(
      ctxFromSession(sessionDoc, index, previousMessages, pastQuestions),
    );
    await usageQuotasRepo.recordCall(
      userId,
      estimateTokens(
        sessionDoc.resumeContent,
        sessionDoc.jobDescription,
        ...previousMessages.map((m) => m.content),
        content,
      ),
    );
    const doc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "question",
      content,
      questionIndex: index,
      promptVersion: PROMPT_VERSION,
      createdAt: new Date().toISOString(),
    };
    await messagesRepo.create(doc);
    return toApiMessage(doc);
  },

  // Returns the user's answer (echoed), the feedback message, and the next question (or null if done).
  // Grouped so the FE does one round-trip per answer and applies state changes atomically.
  async submitAnswer(
    userId: string,
    sessionId: string,
    answer: string,
  ): Promise<{
    answerMsg: Message;
    feedback: Message;
    nextQuestion: Message | null;
    isComplete: boolean;
  }> {
    const sessionDoc = await loadOwnedSession(sessionId, userId);
    if (sessionDoc.status === "completed") {
      throw new SessionError("ALREADY_COMPLETE", "Session already complete");
    }

    const currentQ = await messagesRepo.findQuestionByIndex(
      sessionId,
      sessionDoc.currentQuestionIndex,
    );
    if (!currentQ) {
      throw new SessionError(
        "NOT_FOUND",
        "Current question missing — session state corrupt",
      );
    }

    // Prior transcript (everything BEFORE this answer) — grading context + cost accounting.
    // Loaded before we persist anything so grading happens FIRST: if the LLM call throws
    // (429 / timeout / empty response), nothing has been written, so a retry can't leave an
    // orphan answer row with no feedback. reanswer() already follows this grade-then-persist
    // order; this keeps submitAnswer consistent.
    const previousMessages = (await messagesRepo.listBySession(sessionId)).map(
      (m) => ({ type: m.type, content: m.content }),
    );
    const historyChars = previousMessages.reduce(
      (sum, m) => sum + m.content.length,
      0,
    );
    // Cost guards before grading.
    await ensureUnderQuotaAndLength(
      userId,
      sessionDoc.resumeContent.length +
        sessionDoc.jobDescription.length +
        historyChars +
        answer.length,
    );
    const pastQuestions = await loadPastQuestionsForResume(
      userId,
      sessionDoc.resumeFileName,
    );
    const ctx = ctxFromSession(
      sessionDoc,
      sessionDoc.currentQuestionIndex,
      previousMessages,
      pastQuestions,
    );
    // Grade FIRST. A transient failure here throws before any write, so the user can retry
    // the same answer without accumulating duplicate answer rows for this question index.
    const graded = await llm.gradeAnswer(currentQ.content, answer, ctx);
    await usageQuotasRepo.recordCall(
      userId,
      estimateTokens(
        sessionDoc.resumeContent,
        sessionDoc.jobDescription,
        ...previousMessages.map((m) => m.content),
        answer,
        graded.content,
        ...graded.feedback.strengths,
        ...graded.feedback.improvements,
      ),
    );

    // Grading succeeded — persist the answer and its feedback together so they always land
    // (or fail) as a pair. Answer keeps a `now` timestamp; feedback is +1ms so transcript
    // ordering by createdAt stays stable even on fast loops.
    const now = new Date();
    const answerDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "answer",
      content: answer,
      createdAt: now.toISOString(),
    };
    const feedbackDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "feedback",
      content: graded.content,
      feedback: graded.feedback,
      promptVersion: PROMPT_VERSION,
      createdAt: new Date(now.getTime() + 1).toISOString(),
    };
    await messagesRepo.create(answerDoc);
    await messagesRepo.create(feedbackDoc);

    // Memory writes — index the answer + feedback for retrieval. The feedback row
    // carries the rubric `score` so the dashboard's weak-area aggregation can read
    // memories without joining back to messages. Best-effort; see writeMemory().
    // Fire-and-forget — memory is augmentation, not load-bearing for the response (see
    // initialize()). writeMemory swallows its own errors, so this can never reject.
    void Promise.all([
      writeMemory({
        userId,
        sessionId,
        messageId: answerDoc._id,
        kind: "answer",
        content: answer,
      }),
      writeMemory({
        userId,
        sessionId,
        messageId: feedbackDoc._id,
        kind: "feedback",
        content: graded.content,
        score: graded.feedback.score,
      }),
    ]);

    const nextIndex = sessionDoc.currentQuestionIndex + 1;
    const isComplete = nextIndex >= sessionDoc.totalQuestions;
    await sessionsRepo.updateProgress(
      sessionId,
      nextIndex,
      isComplete ? "completed" : "active",
    );

    let nextQuestion: Message | null = null;
    if (!isComplete) {
      // Cost guard for the next question call. Same input as the grading call plus
      // the new feedback content (which the prompt's history summary may include).
      await ensureUnderQuotaAndLength(
        userId,
        sessionDoc.resumeContent.length +
          sessionDoc.jobDescription.length +
          historyChars +
          answer.length +
          graded.content.length,
      );
      const nextContent = await llm.generateQuestion({
        ...ctx,
        // ctx.previousMessages is the transcript BEFORE this answer; append the answer we
        // just persisted so the follow-up question is informed by it (matches the prior
        // behaviour where the answer row existed before this call).
        previousMessages: [
          ...previousMessages,
          { type: "answer" as const, content: answer },
        ],
        questionIndex: nextIndex,
      });
      await usageQuotasRepo.recordCall(
        userId,
        estimateTokens(
          sessionDoc.resumeContent,
          sessionDoc.jobDescription,
          ...previousMessages.map((m) => m.content),
          answer,
          graded.content,
          nextContent,
        ),
      );
      const nextDoc: MessageDoc = {
        _id: randomUUID(),
        sessionId,
        type: "question",
        content: nextContent,
        questionIndex: nextIndex,
        promptVersion: PROMPT_VERSION,
        createdAt: new Date(now.getTime() + 2).toISOString(),
      };
      await messagesRepo.create(nextDoc);
      nextQuestion = toApiMessage(nextDoc);
    }

    return {
      answerMsg: toApiMessage(answerDoc),
      feedback: toApiMessage(feedbackDoc),
      nextQuestion,
      isComplete,
    };
  },

  /**
   * Start the next round on an existing, completed session. Bumps `currentRound` and
   * extends `totalQuestions` by `questionsPerRound`, re-activates the session, then
   * generates the first question of the new round (with round-aware difficulty ramp
   * via the prompt renderer's `currentRound` branch).
   *
   * Why this isn't `POST /api/sessions` again: the user explicitly chose option B —
   * one session, one growing transcript, ramped difficulty across rounds. Creating a
   * brand-new session would lose that thread. Same resume, same JD, same options;
   * only the round counter and the cumulative `totalQuestions` change.
   *
   * Idempotency: if the session is already active (e.g., a duplicate click after the
   * first one succeeded), throws NOT_COMPLETE rather than silently bumping again.
   */
  async nextRound(
    userId: string,
    sessionId: string,
  ): Promise<{ session: Session; firstQuestion: Message }> {
    const sessionDoc = await loadOwnedSession(sessionId, userId);
    if (sessionDoc.status !== "completed") {
      throw new SessionError(
        "NOT_COMPLETE",
        "Finish the current round before starting the next.",
      );
    }
    const currentRound = sessionDoc.currentRound ?? 1;
    const perRound = sessionDoc.questionsPerRound ?? sessionDoc.totalQuestions;
    const nextRound = currentRound + 1;
    const newTotal = sessionDoc.totalQuestions + perRound;

    // Atomically extend the session — concurrent clicks lose the race but both see
    // a consistent post-state because `findById` after the update reflects the bump.
    await sessionsRepo.advanceRound(sessionId, nextRound, newTotal);

    // Re-load to get the post-update doc for prompt context.
    const refreshed = await sessionsRepo.findById(sessionId);
    if (!refreshed) {
      // Shouldn't happen — we just updated it — but defensive against an exotic
      // delete-during-write race. Same NOT_FOUND code as elsewhere.
      throw new SessionError("NOT_FOUND", "Session not found after round bump");
    }

    // Generate the first question of the new round. Index continues from where the
    // previous round left off (transcript stays one growing thread).
    const previousMessages = (await messagesRepo.listBySession(sessionId)).map(
      (m) => ({ type: m.type, content: m.content }),
    );
    const historyChars = previousMessages.reduce(
      (sum, m) => sum + m.content.length,
      0,
    );
    await ensureUnderQuotaAndLength(
      userId,
      refreshed.resumeContent.length +
        refreshed.jobDescription.length +
        historyChars,
    );
    const pastQuestions = await loadPastQuestionsForResume(
      userId,
      refreshed.resumeFileName,
    );
    const ctx = ctxFromSession(
      refreshed,
      refreshed.currentQuestionIndex,
      previousMessages,
      pastQuestions,
    );
    const firstContent = await llm.generateQuestion(ctx);
    await usageQuotasRepo.recordCall(
      userId,
      estimateTokens(
        refreshed.resumeContent,
        refreshed.jobDescription,
        ...previousMessages.map((m) => m.content),
        firstContent,
      ),
    );

    const firstDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "question",
      content: firstContent,
      questionIndex: refreshed.currentQuestionIndex,
      promptVersion: PROMPT_VERSION,
      createdAt: new Date().toISOString(),
    };
    await messagesRepo.create(firstDoc);

    return {
      session: toApiSession(refreshed),
      firstQuestion: toApiMessage(firstDoc),
    };
  },

  /**
   * Re-answer a past question. Lets the user revisit a previously-graded question
   * and submit a fresh attempt — the original answer + feedback stay in the
   * transcript, the retry appends new `answer` and `feedback` rows alongside.
   *
   * Doesn't advance `currentQuestionIndex` and doesn't change session status, so
   * a completed session that gets a re-answer remains completed (no surprise
   * re-activation). Round chaining is the path for "give me more questions";
   * re-answer is the path for "let me try that one again."
   */
  async reanswer(
    userId: string,
    sessionId: string,
    questionIndex: number,
    answer: string,
  ): Promise<{ answerMsg: Message; feedback: Message }> {
    const sessionDoc = await loadOwnedSession(sessionId, userId);
    const question = await messagesRepo.findQuestionByIndex(
      sessionId,
      questionIndex,
    );
    if (!question) {
      throw new SessionError(
        "NOT_FOUND",
        `No question at index ${questionIndex} in this session.`,
      );
    }

    // Build the same prompt context the original grading used, with the full prior
    // transcript so the LLM can spot improvement vs. the first attempt.
    const previousMessages = (await messagesRepo.listBySession(sessionId)).map(
      (m) => ({ type: m.type, content: m.content }),
    );
    const historyChars = previousMessages.reduce(
      (sum, m) => sum + m.content.length,
      0,
    );
    await ensureUnderQuotaAndLength(
      userId,
      sessionDoc.resumeContent.length +
        sessionDoc.jobDescription.length +
        historyChars +
        answer.length,
    );

    const ctx = ctxFromSession(sessionDoc, questionIndex, previousMessages);
    const graded = await llm.gradeAnswer(question.content, answer, ctx);
    await usageQuotasRepo.recordCall(
      userId,
      estimateTokens(
        sessionDoc.resumeContent,
        sessionDoc.jobDescription,
        ...previousMessages.map((m) => m.content),
        answer,
        graded.content,
        ...graded.feedback.strengths,
        ...graded.feedback.improvements,
      ),
    );

    const now = new Date();
    // Persist the retry as new answer + feedback rows. They sort to the END of the
    // transcript by createdAt — the original Q/A/F triplet stays intact above them
    // so the user can compare attempts side by side.
    const answerDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "answer",
      content: answer,
      createdAt: now.toISOString(),
    };
    await messagesRepo.create(answerDoc);

    const feedbackDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "feedback",
      content: graded.content,
      feedback: graded.feedback,
      promptVersion: PROMPT_VERSION,
      createdAt: new Date(now.getTime() + 1).toISOString(),
    };
    await messagesRepo.create(feedbackDoc);

    // Memory writes — same shape as the regular submitAnswer path.
    // Fire-and-forget — memory is augmentation, not load-bearing for the response (see
    // initialize()). writeMemory swallows its own errors, so this can never reject.
    void Promise.all([
      writeMemory({
        userId,
        sessionId,
        messageId: answerDoc._id,
        kind: "answer",
        content: answer,
      }),
      writeMemory({
        userId,
        sessionId,
        messageId: feedbackDoc._id,
        kind: "feedback",
        content: graded.content,
        score: graded.feedback.score,
      }),
    ]);

    return {
      answerMsg: toApiMessage(answerDoc),
      feedback: toApiMessage(feedbackDoc),
    };
  },

  /**
   * List the current user's sessions, newest first. Powers the chatroom sidebar
   * (replaces the localStorage archive once authenticated) and the dashboard.
   */
  async listSessions(userId: string): Promise<Session[]> {
    const docs = await sessionsRepo.listByUser(userId);
    return docs.map(toApiSession);
  },

  /**
   * Hydrate a single session's full transcript. Owner check + return all messages in
   * createdAt order. Used by the chatroom sidebar to "open" a past session.
   */
  async listMessages(userId: string, sessionId: string): Promise<Message[]> {
    await loadOwnedSession(sessionId, userId); // throws on miss / forbidden
    const docs = await messagesRepo.listBySession(sessionId);
    return docs.map(toApiMessage);
  },

  /**
   * Delete a session and every row that references it — messages + memories. Called
   * from `DELETE /api/sessions/:id` when the user wipes a chatroom from the sidebar.
   *
   * Order matters: drop messages first (cheap, frequent reads), then memories (vector
   * store rows, more expensive to leave dangling), then the session row itself. If any
   * step fails, the leftover rows on the next attempt will be picked up by retry — the
   * delete is idempotent at each stage.
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await loadOwnedSession(sessionId, userId); // throws NOT_FOUND / FORBIDDEN
    await messagesRepo.deleteBySession(sessionId);
    await memoriesRepo.deleteBySession(sessionId);
    await sessionsRepo.deleteById(sessionId);
  },
};
