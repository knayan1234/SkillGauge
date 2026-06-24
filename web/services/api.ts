// Real HTTP client. Talks to the Express backend over JSON with cookie auth.
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
  // Parsed plain-text resume content the BE extracted on session init. Used by the
  // sidebar "View resume" dialog to display the text the LLM is grading against.
  resumeContent?: string;
  resumeFileName?: string;
  // Round chaining: one session can extend through multiple rounds where round 2+
  // ramps difficulty and references prior weak areas. Defaults: round 1,
  // questionsPerRound = original questionCount.
  currentRound?: number;
  questionsPerRound?: number;
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

// Must mirror sessionSetupSchema enums + backend contracts.ts.
export type InterviewStyle = "behavioral" | "technical" | "mixed";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type RoleLevel = "junior" | "mid" | "senior" | "lead";
export type InterviewerPersona = "neutral" | "faang" | "startup" | "consulting";

export interface SessionOptions {
  interviewStyle: InterviewStyle;
  difficulty: DifficultyLevel;
  roleLevel: RoleLevel;
  questionCount: number;
  focusAreas?: string;
  // Optional; defaults to "neutral" at the BE if omitted.
  interviewerPersona?: InterviewerPersona;
}

export interface SessionInitRequest extends SessionOptions {
  resumeFileName: string;
  // Base64-encoded raw file bytes. The BE base64-decodes and dispatches to a parser
  // (pdf-parse / mammoth / UTF-8 fallback) based on resumeMime.
  resumeContent: string;
  resumeMime: string;
  jobDescription: string;
}

export interface AnswerResult {
  answerMsg: Message;
  feedback: Message;
  nextQuestion: Message | null;
  isComplete: boolean;
}

// Same-origin BFF path. Every `/api/*` call from the browser lands on the Next route
// handler at [web/app/api/[...path]/route.ts](../../web/app/api/[...path]/route.ts),
// which proxies server-side to the Express backend (`process.env.BACKEND_URL`). Two wins:
//   1. No CORS preflights — same-origin requests don't need them.
//   2. The BE hostname stays out of the JS bundle — `BACKEND_URL` is server-only.
//
// `NEXT_PUBLIC_API_BASE_URL` was the old direct-to-Express URL; it's now ignored on the
// FE (still read by the BFF as a fallback) so .env.local files keep working unchanged.
const API_BASE = "";

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
  llmProvider: "stub" | "openai" | "anthropic" | "gemini";
  // Populated with the model name (e.g. "gpt-4o-mini" / "gemini-2.0-flash") when a
  // real provider is configured; null when LLM_PROVIDER=stub.
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

// Start the next round on a completed session — bumps `currentRound`, extends
// `totalQuestions`, re-activates the session, and returns the first question of the
// new round. The transcript stays one growing thread (option B chaining); the prompt
// renderer ramps difficulty and references prior weak areas in round 2+.
export async function startNextRound(
  sessionId: string,
): Promise<{ session: Session; firstQuestion: Message }> {
  return apiFetch(
    `/api/sessions/${encodeURIComponent(sessionId)}/rounds/next`,
    { method: "POST" },
  );
}

// List the current user's sessions newest-first. Replaces the localStorage archive
// for authenticated users; falls back to the archive only when offline / unauth.
export async function listSessions(): Promise<Session[]> {
  const res = await apiFetch<{ sessions: Session[] }>("/api/sessions");
  return res.sessions;
}

// Delete a session and every row that references it (messages + memories). The
// backend cascades; the FE invalidates the sessions cache after this resolves so
// the sidebar drops the entry immediately.
export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch<void>(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

// Hydrate a past session's full transcript by id. Used by the sidebar's "open past
// session" interaction to replay messages into the chat panel.
export async function fetchSessionMessages(
  sessionId: string,
): Promise<Message[]> {
  const res = await apiFetch<{ messages: Message[] }>(
    `/api/sessions/${encodeURIComponent(sessionId)}/messages`,
  );
  return res.messages;
}

// Re-answer a past question. Returns the new answer + feedback rows; the original
// row stays in the transcript so the user can compare attempts side by side.
export async function reanswerQuestion(
  sessionId: string,
  questionIndex: number,
  answer: string,
): Promise<{ answerMsg: Message; feedback: Message }> {
  return apiFetch(
    `/api/sessions/${encodeURIComponent(sessionId)}/questions/${questionIndex}/reanswer`,
    {
      method: "POST",
      body: JSON.stringify({ answer }),
    },
  );
}

// Dashboard summary — one round-trip returns headline stats, score trend, weak areas,
// and a per-style practice breakdown. Used by the `/dashboard` page.
export interface DashboardSummary {
  stats: {
    totalSessions: number;
    totalQuestionsAnswered: number;
    averageScore: number | null;
    bestScore: number | null;
  };
  scoreTrend: Array<{ at: string; score: number }>;
  weakAreas: Array<{ phrase: string; count: number }>;
  // Optional so a stale BE that hasn't shipped this field yet doesn't break the FE —
  // consumers fall back to a zeroed object when undefined.
  styleBreakdown?: Record<"behavioral" | "technical" | "mixed", number>;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/dashboard/summary");
}

/**
 * Per-resume bank — one entry per distinct resume filename, with the full question
 * history (every question ever asked of this resume). Backs the dashboard's "My
 * resumes" panel and proves the "no repeated questions" claim concretely.
 */
export interface ResumeBankEntry {
  resumeFileName: string;
  resumeContent: string;
  sessionCount: number;
  questions: Array<{ content: string; createdAt: string; sessionId: string }>;
  averageScore: number | null;
  lastUsed: string;
}

export async function fetchResumeBank(): Promise<ResumeBankEntry[]> {
  const res = await apiFetch<{ resumes: ResumeBankEntry[] }>(
    "/api/dashboard/resumes",
  );
  return res.resumes;
}
