import { getDb } from "../connection";
import type {
  InterviewStyle,
  InterviewerPersona,
  DifficultyLevel,
  RoleLevel,
} from "@/shared/types";

export interface SessionDoc {
  _id: string;
  userId: string;
  title: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: "active" | "completed";
  resumeFileName: string;
  resumeContent: string;
  jobDescription: string;
  interviewStyle: InterviewStyle;
  difficulty: DifficultyLevel;
  roleLevel: RoleLevel;
  focusAreas?: string;
  // Optional interviewer flavour. Defaults to `neutral` at the service layer when
  // omitted; legacy docs without this field read as neutral.
  interviewerPersona?: InterviewerPersona;
  createdAt: string;
  // Round number this session is currently on. Starts at 1; bumps when the user clicks
  // "Start next round" after a round completes (option-B chaining — same session, same
  // resumé/JD, growing transcript, ramped difficulty in round N+1). Legacy docs without
  // this field default to 1 at read time.
  currentRound?: number;
  // Questions per round. Stored separately from `totalQuestions` so the LLM context
  // knows the round size; `totalQuestions` is the cumulative cap (= currentRound *
  // questionsPerRound). Defaults to the original questionCount on create.
  questionsPerRound?: number;
}

async function sessions() {
  return (await getDb()).collection<SessionDoc>("sessions");
}

export const sessionsRepo = {
  async create(doc: SessionDoc): Promise<void> {
    await (await sessions()).insertOne(doc);
  },

  async findById(id: string): Promise<SessionDoc | null> {
    return (await sessions()).findOne({ _id: id });
  },

  // Ownership check is done at the service layer (compare userId). Never expose raw
  // findById to a route without that check or a user can read another user's session.
  async updateProgress(
    id: string,
    currentIndex: number,
    status: "active" | "completed",
  ): Promise<void> {
    await (await sessions()).updateOne(
      { _id: id },
      { $set: { currentQuestionIndex: currentIndex, status } },
    );
  },

  /**
   * Advance to the next round. Atomic so two concurrent "next round" clicks don't
   * double-bump. Returns the new round + totalQuestions on success.
   */
  async advanceRound(
    id: string,
    nextRound: number,
    nextTotalQuestions: number,
  ): Promise<void> {
    await (await sessions()).updateOne(
      { _id: id },
      {
        $set: {
          currentRound: nextRound,
          totalQuestions: nextTotalQuestions,
          status: "active",
        },
      },
    );
  },

  /**
   * List one user's sessions newest-first. Used by the chatroom sidebar (replaces the
   * localStorage archive once authenticated) and by the dashboard. Capped at `limit`
   * so a user with hundreds of sessions doesn't blow the response payload; pagination
   * via `before` cursor can be added when that becomes a real concern.
   */
  async listByUser(userId: string, limit = 50): Promise<SessionDoc[]> {
    return (await sessions())
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  },

  /**
   * Delete one session row. Returns whether a row was actually deleted — used by the
   * service layer to distinguish "not found" from "deleted." Cascading deletes for
   * messages + memories happen in the service, not here, so each repo stays focused.
   */
  async deleteById(id: string): Promise<boolean> {
    const res = await (await sessions()).deleteOne({ _id: id });
    return res.deletedCount > 0;
  },
};
