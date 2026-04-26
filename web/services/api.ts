// Real HTTP client. Talks to the Fastify backend over JSON with cookie auth.
// Swap target: whatever API_BASE points at (local dev → http://localhost:4000).
// Signatures match ARCHITECTURE.md §13 contract.

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  // The auth cookie is Set-Cookie'd by the server; no token field on the body.
  user: User;
}

export interface Session {
  id: string;
  title: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: "active" | "completed";
  createdAt: string;
}

export interface Message {
  id: string;
  type: "question" | "answer" | "feedback";
  content: string;
  timestamp: string;
  feedback?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
}

// Must mirror sessionSetupSchema enums + backend sessions.schema.ts.
export type InterviewStyle = "behavioral" | "technical" | "mixed";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type RoleLevel = "junior" | "mid" | "senior" | "lead";

export interface SessionOptions {
  interviewStyle: InterviewStyle;
  difficulty: DifficultyLevel;
  roleLevel: RoleLevel;
  questionCount: number;
  focusAreas?: string;
}

export interface SessionInitRequest extends SessionOptions {
  resumeFileName: string;
  resumeContent: string;
  jobDescription: string;
}

export interface AnswerResult {
  answerMsg: Message;
  feedback: Message;
  nextQuestion: Message | null;
  isComplete: boolean;
}

// Allow overriding via env for staged deploys; default matches the backend dev port.
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // Machine-readable error code from `/api/auth/*` and `/api/sessions/*` (e.g.
    // "EMAIL_TAKEN", "INVALID_CREDENTIALS", "SESSION_FORBIDDEN"). Optional because
    // some routes (legacy `/api/health` ok responses, third-party errors) don't carry it.
    public readonly code?: string,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // credentials: "include" is the whole reason we're on a httpOnly cookie — the browser
  // attaches skillgauge_session automatically on cross-origin calls to API_BASE.
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
    error?: string;
  } & Record<string, unknown>;
  if (!res.ok) {
    // Prefer the new {code, message} shape; fall back to legacy {error} for routes that
    // haven't been migrated yet (sessions/health). res.statusText is the final fallback.
    const message = body.message ?? body.error ?? res.statusText;
    throw new ApiError(res.status, message, body.code);
  }
  return body as T;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser(): Promise<void> {
  await apiFetch<void>("/api/auth/logout", { method: "POST" });
}

// Password reset flow.
// Request: opaque 200 even if the email isn't registered. Caller must NOT branch on
// "did the email exist" — we deliberately don't expose that signal.
export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch<void>("/api/auth/password/reset-request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Confirm: 200 on success; 400 INVALID_TOKEN on bad/expired/used token; 400 INVALID_FORMAT
// on schema fail. Caller surfaces err.message directly.
export async function confirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<void>("/api/auth/password/reset-confirm", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

// Public health/info endpoint exposing the active LLM provider + model. Used by the
// LlmBadge in the interview header. No auth, no PII; cached client-side with
// staleTime: Infinity since the value rarely changes (only when ops swap LLM_PROVIDER
// in env and restart the server — a deploy event the user isn't expected to see live).
export interface HealthInfo {
  llmProvider: "stub" | "openai" | "anthropic";
  // Populated with the model name (e.g. "gpt-4o-mini") when a real provider is
  // configured; null when LLM_PROVIDER=stub.
  llmModel: string | null;
}

export async function fetchHealthInfo(): Promise<HealthInfo> {
  return apiFetch<HealthInfo>("/api/health/info");
}

// Returns null on 401 so the query-cache can store "unauthenticated" as a real state
// instead of a thrown error — the FE treats "no cookie / expired cookie" identically.
export async function fetchMe(): Promise<User | null> {
  try {
    const res = await apiFetch<{ user: User }>("/api/me");
    return res.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function initializeSession(
  request: SessionInitRequest,
): Promise<{ session: Session; firstQuestion: Message }> {
  return apiFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getNextQuestion(
  sessionId: string,
  questionIndex: number,
): Promise<Message> {
  return apiFetch<Message>(
    `/api/sessions/${encodeURIComponent(sessionId)}/questions/${questionIndex}`,
  );
}

export async function submitAnswer(
  sessionId: string,
  answer: string,
): Promise<AnswerResult> {
  return apiFetch<AnswerResult>(
    `/api/sessions/${encodeURIComponent(sessionId)}/answers`,
    {
      method: "POST",
      body: JSON.stringify({ answer }),
    },
  );
}
