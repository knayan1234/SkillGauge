// Wire-level contract shared with the FE. Must match web/services/api.ts types exactly.
// Changing these is a breaking API change — bump the route version before editing.

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
}

export interface Session {
  id: string;
  title: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: "active" | "completed";
  createdAt: string;
  // Parsed plain-text résumé content the BE extracted on session init (PDF/DOCX/text
  // all converge to text here). Populated on the response from POST /api/sessions so
  // the FE sidebar's "View resume" dialog can display it directly without re-parsing.
  resumeContent?: string;
  resumeFileName?: string;
}

export interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
}

export interface Message {
  id: string;
  type: "question" | "answer" | "feedback";
  content: string;
  timestamp: string;
  feedback?: Feedback;
}

export type InterviewStyle = "behavioral" | "technical" | "mixed";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type RoleLevel = "junior" | "mid" | "senior" | "lead";

export interface SessionInitRequest {
  resumeFileName: string;
  // Base64-encoded raw file bytes. The BE base64-decodes and dispatches to a parser
  // based on `resumeMime`. The persisted `resumeContent` on the session doc is the
  // EXTRACTED PLAIN TEXT, not the original base64 — once parsed, the bytes are gone.
  resumeContent: string;
  resumeMime: string;
  jobDescription: string;
  interviewStyle: InterviewStyle;
  difficulty: DifficultyLevel;
  roleLevel: RoleLevel;
  questionCount: number;
  focusAreas?: string;
}
