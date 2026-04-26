import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { sessionsRepo, type SessionDoc } from "@/db/repos/sessions";
import { messagesRepo, type MessageDoc } from "@/db/repos/messages";
import { usageQuotasRepo } from "@/db/repos/usageQuotas";
import { createLLMClient } from "@/llm/index";
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
      | "INPUT_TOO_LARGE",
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
 * LLM — concatenated résumé + JD + answer history + the rendered prompt.
 */
async function ensureUnderQuotaAndLength(
  userId: string,
  inputChars: number,
): Promise<void> {
  if (inputChars > env.MAX_INPUT_CHARS) {
    throw new SessionError(
      "INPUT_TOO_LARGE",
      `Input exceeds the per-call cap of ${env.MAX_INPUT_CHARS} characters. Trim your résumé or answer.`,
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

function toApiSession(doc: SessionDoc): Session {
  return {
    id: doc._id,
    title: doc.title,
    currentQuestionIndex: doc.currentQuestionIndex,
    totalQuestions: doc.totalQuestions,
    status: doc.status,
    createdAt: doc.createdAt,
    // Parsed text (post-2c). Cheap to include — the FE displays it in the resume
    // preview dialog without having to fetch a second endpoint.
    resumeContent: doc.resumeContent,
    resumeFileName: doc.resumeFileName,
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
function ctxFromSession(
  doc: SessionDoc,
  questionIndex: number,
  previousMessages: ReadonlyArray<{ type: MessageDoc["type"]; content: string }>,
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
    previousMessages,
  };
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
      createdAt: now,
    };
    await sessionsRepo.create(sessionDoc);

    // Cost guards before the first LLM call. Input length = résumé + JD only; the
    // history is empty on initialise.
    await ensureUnderQuotaAndLength(
      userId,
      sessionDoc.resumeContent.length + sessionDoc.jobDescription.length,
    );
    const firstContent = await llm.generateQuestion(
      ctxFromSession(sessionDoc, 0, []),
    );
    // Account for tokens. Stub returns no usage data; estimate from input + output.
    await usageQuotasRepo.recordCall(
      userId,
      estimateTokens(sessionDoc.resumeContent, sessionDoc.jobDescription, firstContent),
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
    // Cost guards. Input length sums résumé + JD + concatenated message history so
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
    const content = await llm.generateQuestion(
      ctxFromSession(sessionDoc, index, previousMessages),
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

    const now = new Date();
    const answerDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "answer",
      content: answer,
      createdAt: now.toISOString(),
    };
    await messagesRepo.create(answerDoc);

    const previousMessages = (await messagesRepo.listBySession(sessionId)).map(
      (m) => ({ type: m.type, content: m.content }),
    );
    // Cost guards before grading.
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
    const ctx = ctxFromSession(
      sessionDoc,
      sessionDoc.currentQuestionIndex,
      previousMessages,
    );
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

    const feedbackDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "feedback",
      content: graded.content,
      feedback: graded.feedback,
      promptVersion: PROMPT_VERSION,
      // +1ms so list ordering by createdAt is stable even on fast loops.
      createdAt: new Date(now.getTime() + 1).toISOString(),
    };
    await messagesRepo.create(feedbackDoc);

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
};
