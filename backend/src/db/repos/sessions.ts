import { getDb } from "../connection";
import type {
  InterviewStyle,
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
  createdAt: string;
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
};
