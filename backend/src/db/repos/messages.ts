import { getDb } from "../connection";
import type { Feedback } from "@/shared/types";

export interface MessageDoc {
  _id: string;
  sessionId: string;
  type: "question" | "answer" | "feedback";
  content: string;
  // Present only on feedback messages; stored as a subdoc rather than a serialized string
  // (the reason we're on Mongo).
  feedback?: Feedback;
  // Present only on question messages — powers the idempotency index.
  questionIndex?: number;
  // Which prompt-template version produced this message. Set on question + feedback
  // rows by the LLM-calling code path; absent on user-typed answer rows. Lets analytics
  // compare answer scores across prompt revisions when v2 ships.
  promptVersion?: string;
  createdAt: string;
}

async function messages() {
  return (await getDb()).collection<MessageDoc>("messages");
}

export const messagesRepo = {
  async create(doc: MessageDoc): Promise<void> {
    await (await messages()).insertOne(doc);
  },

  async findQuestionByIndex(
    sessionId: string,
    index: number,
  ): Promise<MessageDoc | null> {
    // The partial unique index on { sessionId, questionIndex } backs this lookup — at most one
    // question can exist per (sessionId, index), so idempotency is enforced at the storage layer.
    return (await messages()).findOne({
      sessionId,
      type: "question",
      questionIndex: index,
    });
  },

  async listBySession(sessionId: string): Promise<MessageDoc[]> {
    return (await messages())
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .toArray();
  },
};
