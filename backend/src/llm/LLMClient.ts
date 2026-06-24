// Provider-agnostic interface. The default `stubClient` implements it; OpenAI/Anthropic
// adapters slot in behind the same type — handlers never import a vendor SDK directly.
// See ARCHITECTURE.md §17 (testing strategy) + §10 (LLM abstraction).

import type {
  InterviewStyle,
  InterviewerPersona,
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
  // Round number this question is being generated for. Round 1 is the default; round 2+
  // means the user has already completed at least one full round on this same resume/JD,
  // so the prompt should ramp difficulty and reference patterns from prior answers.
  currentRound?: number;
  // Interviewer flavour. Defaults to `neutral` (no extra prompt content).
  interviewerPersona?: InterviewerPersona;
  previousMessages: ReadonlyArray<{
    type: "question" | "answer" | "feedback";
    content: string;
  }>;
  /**
   * Every question this user has been asked across ALL of their sessions on this same
   * resume. The renderer pipes these into the prompt as an explicit "do not repeat"
   * list so the LLM doesn't regurgitate questions from prior chatrooms — the
   * differentiator that "every question stored per resume, no repeats" is real.
   * Truncated by the renderer if the list grows large; capped to recent N to stay
   * under the per-call token budget.
   */
  pastQuestionsForResume?: ReadonlyArray<string>;
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
