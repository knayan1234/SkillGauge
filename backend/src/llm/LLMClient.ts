// Provider-agnostic interface. The default `stubClient` implements it; OpenAI/Anthropic
// adapters slot in behind the same type — handlers never import a vendor SDK directly.
// See ARCHITECTURE.md §17 (testing strategy) + §10 (LLM abstraction).

import type {
  InterviewStyle,
  DifficultyLevel,
  RoleLevel,
} from "@/shared/types";

export interface QuestionContext {
  questionIndex: number;
  totalQuestions: number;
  resumeContent: string;
  jobDescription: string;
  interviewStyle: InterviewStyle;
  difficulty: DifficultyLevel;
  roleLevel: RoleLevel;
  focusAreas?: string;
  previousMessages: ReadonlyArray<{
    type: "question" | "answer" | "feedback";
    content: string;
  }>;
}

export interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
}

export interface GradedAnswer {
  content: string;
  feedback: Feedback;
}

export interface LLMClient {
  generateQuestion(ctx: QuestionContext): Promise<string>;
  gradeAnswer(
    question: string,
    answer: string,
    ctx: QuestionContext,
  ): Promise<GradedAnswer>;
}
