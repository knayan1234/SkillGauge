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

  /**
   * Cascade-delete every message tied to a given session. Called from the service
   * layer when a user deletes a chatroom; never expose this without an ownership
   * check upstream.
   */
  async deleteBySession(sessionId: string): Promise<void> {
    await (await messages()).deleteMany({ sessionId });
  },

  /**
   * Distinct question texts asked across all sessions for a given user + resume file
   * name. Backs (a) the question-bank dashboard panel — proves the "no repeated
   * questions" claim by surfacing the running list — and (b) the non-repetition guard
   * in the question generator: the planner reads this list and instructs the LLM to
   * avoid topics already covered for this resume.
   *
   * Two-stage aggregation: filter messages by `type: "question"` joined to sessions
   * filtered by `userId + resumeFileName`. The number of past questions per resume
   * stays small (a few hundred at most), so the in-memory lookup is fine — promote
   * to a dedicated index only if profiling shows a hot path here.
   */
  async findQuestionsByResume(
    userId: string,
    resumeFileName: string,
  ): Promise<Array<{ content: string; createdAt: string; sessionId: string }>> {
    const db = await getDb();
    const cursor = db.collection<MessageDoc>("messages").aggregate<{
      content: string;
      createdAt: string;
      sessionId: string;
    }>([
      { $match: { type: "question" } },
      {
        $lookup: {
          from: "sessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      {
        $match: {
          "session.userId": userId,
          "session.resumeFileName": resumeFileName,
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $project: {
          _id: 0,
          content: 1,
          createdAt: 1,
          sessionId: 1,
        },
      },
    ]);
    return cursor.toArray();
  },
};
