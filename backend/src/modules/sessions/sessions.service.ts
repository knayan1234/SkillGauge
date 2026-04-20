import { randomUUID } from "node:crypto";
import { sessionsRepo, type SessionDoc } from "@/db/repos/sessions";
import { messagesRepo, type MessageDoc } from "@/db/repos/messages";
import { createLLMClient } from "@/llm/index";
import type { Session, Message, SessionInitRequest } from "@/shared/types";

export class SessionError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "ALREADY_COMPLETE"
      | "INDEX_MISMATCH",
    message: string,
  ) {
    super(message);
  }
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
    const now = new Date().toISOString();
    const sessionDoc: SessionDoc = {
      _id: randomUUID(),
      userId,
      title: titleFor(request),
      currentQuestionIndex: 0,
      totalQuestions: request.questionCount,
      status: "active",
      resumeFileName: request.resumeFileName,
      resumeContent: request.resumeContent,
      jobDescription: request.jobDescription,
      interviewStyle: request.interviewStyle,
      difficulty: request.difficulty,
      roleLevel: request.roleLevel,
      focusAreas: request.focusAreas,
      createdAt: now,
    };
    await sessionsRepo.create(sessionDoc);

    const firstContent = await llm.generateQuestion(
      ctxFromSession(sessionDoc, 0, []),
    );
    const firstDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId: sessionDoc._id,
      type: "question",
      content: firstContent,
      questionIndex: 0,
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
    const content = await llm.generateQuestion(
      ctxFromSession(sessionDoc, index, previousMessages),
    );
    const doc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "question",
      content,
      questionIndex: index,
      createdAt: new Date().toISOString(),
    };
    await messagesRepo.create(doc);
    return toApiMessage(doc);
  },

  // Returns the user's answer (echoed), the feedback message, and the next question (or null if done).
  // Grouped so the FE does one round-trip per answer — mirrors Phase 0b's atomic state transition.
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
    const ctx = ctxFromSession(
      sessionDoc,
      sessionDoc.currentQuestionIndex,
      previousMessages,
    );
    const graded = await llm.gradeAnswer(currentQ.content, answer, ctx);

    const feedbackDoc: MessageDoc = {
      _id: randomUUID(),
      sessionId,
      type: "feedback",
      content: graded.content,
      feedback: graded.feedback,
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
      const nextContent = await llm.generateQuestion({
        ...ctx,
        questionIndex: nextIndex,
      });
      const nextDoc: MessageDoc = {
        _id: randomUUID(),
        sessionId,
        type: "question",
        content: nextContent,
        questionIndex: nextIndex,
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
