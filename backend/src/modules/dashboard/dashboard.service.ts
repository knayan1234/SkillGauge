/**
 * Dashboard aggregations — walks the user's session + message history and computes
 * the headline stats the `/dashboard` page renders.
 *
 * Why a service layer (not just inline aggregations in the route): the same shape
 * may eventually feed a PDF report or a "share my progress" surface. Keeping the
 * aggregation logic in one place means those consumers reuse the same numbers the
 * dashboard shows.
 *
 * Scope today:
 *   - Total sessions / total questions answered / average score
 *   - Score trend — array of { at, score } from every feedback message, ordered
 *     by createdAt. The FE bins this into a recharts LineChart.
 *   - Weak areas — the top recurring phrases pulled from `feedback.improvements`
 *     across all sessions. Simple frequency count over normalised tokens.
 *
 * Performance: today this walks the whole user history per call. Fine at personal
 * scale (hundreds of messages). When it bites, swap to a precomputed materialised
 * view written on each feedback insert. Deferred — premature optimisation today.
 */

import { getDb } from "@/db/connection";

export interface DashboardSummary {
  stats: {
    totalSessions: number;
    totalQuestionsAnswered: number;
    averageScore: number | null;
    bestScore: number | null;
  };
  scoreTrend: Array<{ at: string; score: number }>;
  weakAreas: Array<{ phrase: string; count: number }>;
  /**
   * Per-style practice breakdown — `{ behavioral: 12, technical: 8, mixed: 4 }`. Cheap
   * deterministic categorisation using `session.interviewStyle`. The dashboard renders
   * this as a simple share/breakdown without any LLM tagging cost.
   */
  styleBreakdown: Record<"behavioral" | "technical" | "mixed", number>;
}

/**
 * Per-résumé bank record. One entry per distinct résumé filename the user has used.
 * Backs the dashboard's "My Résumés" panel + question-bank modal.
 */
export interface ResumeBankEntry {
  resumeFileName: string;
  /** Latest parsed résumé text — useful for the "View résumé" modal. */
  resumeContent: string;
  sessionCount: number;
  /** Distinct question texts asked across all sessions on this résumé, oldest first. */
  questions: Array<{ content: string; createdAt: string; sessionId: string }>;
  /** Average rubric score across every graded answer on this résumé, or null if none. */
  averageScore: number | null;
  /** ISO timestamp of the most recent session start on this résumé. */
  lastUsed: string;
}

// Tokens we don't count as weak-area signals — function words and high-frequency
// boilerplate that drowns out useful phrases. Curated rather than NLP-derived because
// we're aggregating English-only feedback strings of bounded vocabulary.
const STOPWORDS = new Set<string>([
  "the", "a", "an", "and", "or", "but", "your", "you", "to", "of", "in", "on", "at",
  "by", "for", "with", "be", "is", "are", "was", "were", "should", "could", "would",
  "more", "less", "very", "also", "this", "that", "those", "these", "it", "its",
  "their", "they", "them", "we", "us", "our", "answer", "question", "candidate",
  "feedback", "explain", "explanation", "clearer", "clearly", "concrete", "specific",
  "details", "detail", "example", "examples", "consider", "try", "instead", "rather",
  "without", "within", "about", "into", "from", "than", "then", "while", "as",
  "have", "has", "had", "do", "does", "did", "can", "may", "might", "will",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    // Strip everything that's not a-z or whitespace; collapse to single spaces.
    .replace(/[^a-z\s]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
}

type SessionSummaryRow = {
  _id: string;
  userId: string;
  interviewStyle: "behavioral" | "technical" | "mixed";
  resumeFileName: string;
  resumeContent: string;
  createdAt: string;
};

export const dashboardService = {
  async summary(userId: string): Promise<DashboardSummary> {
    const db = await getDb();
    const sessions = db.collection<SessionSummaryRow>("sessions");
    const messages = db.collection<{
      _id: string;
      sessionId: string;
      type: "question" | "answer" | "feedback";
      content: string;
      feedback?: { score: number; strengths: string[]; improvements: string[] };
      createdAt: string;
    }>("messages");

    // Pull session id + interviewStyle in one round-trip — both are needed below.
    const userSessions = await sessions
      .find({ userId })
      .project<{ _id: string; interviewStyle: SessionSummaryRow["interviewStyle"] }>({
        _id: 1,
        interviewStyle: 1,
      })
      .toArray();
    const userSessionIds = userSessions.map((s) => s._id);

    const styleBreakdown: DashboardSummary["styleBreakdown"] = {
      behavioral: 0,
      technical: 0,
      mixed: 0,
    };
    for (const s of userSessions) {
      // Defensive — legacy rows without a style fall through silently.
      if (s.interviewStyle in styleBreakdown) {
        styleBreakdown[s.interviewStyle] += 1;
      }
    }

    if (userSessionIds.length === 0) {
      return {
        stats: {
          totalSessions: 0,
          totalQuestionsAnswered: 0,
          averageScore: null,
          bestScore: null,
        },
        scoreTrend: [],
        weakAreas: [],
        styleBreakdown,
      };
    }

    // Pull every answer + feedback message for this user in one query. Cheap relative
    // to per-session round-trips and keeps the aggregation logic simple in JS.
    const userMessages = await messages
      .find({
        sessionId: { $in: userSessionIds },
        type: { $in: ["answer", "feedback"] },
      })
      .sort({ createdAt: 1 })
      .toArray();

    const answers = userMessages.filter((m) => m.type === "answer");
    const feedbacks = userMessages.filter((m) => m.type === "feedback" && m.feedback);

    const scores = feedbacks
      .map((f) => f.feedback?.score ?? null)
      .filter((s): s is number => typeof s === "number");

    const averageScore =
      scores.length === 0
        ? null
        : Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10;
    const bestScore = scores.length === 0 ? null : Math.max(...scores);

    const scoreTrend = feedbacks
      .map((f) => ({
        at: f.createdAt,
        score: f.feedback?.score ?? 0,
      }))
      .filter((p) => typeof p.score === "number");

    // Weak areas: collect every improvement phrase, tokenize, count frequencies, take
    // the top entries. Simple but effective at personal scale — captures recurring
    // language ("metrics", "scalability", "tradeoffs") without needing NLP.
    const counts = new Map<string, number>();
    for (const f of feedbacks) {
      for (const imp of f.feedback?.improvements ?? []) {
        for (const tok of tokenize(imp)) {
          counts.set(tok, (counts.get(tok) ?? 0) + 1);
        }
      }
    }
    const weakAreas = Array.from(counts.entries())
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      stats: {
        totalSessions: userSessionIds.length,
        totalQuestionsAnswered: answers.length,
        averageScore,
        bestScore,
      },
      scoreTrend,
      weakAreas,
      styleBreakdown,
    };
  },

  /**
   * "My Résumés" data — one entry per distinct résumé filename the user has uploaded.
   * For each résumé we surface the canonical content (latest version), session count,
   * average score, last-used timestamp, and the full question bank (every question
   * ever asked on this résumé, ordered chronologically). The question bank is the
   * concrete proof of "no repeated questions" — users can scroll the list and see
   * every angle the system has already covered.
   */
  async resumes(userId: string): Promise<ResumeBankEntry[]> {
    const db = await getDb();
    const sessions = db.collection<SessionSummaryRow>("sessions");
    const messages = db.collection<{
      _id: string;
      sessionId: string;
      type: "question" | "answer" | "feedback";
      content: string;
      feedback?: { score: number };
      createdAt: string;
    }>("messages");

    const userSessions = await sessions
      .find({ userId })
      .project<{
        _id: string;
        resumeFileName: string;
        resumeContent: string;
        createdAt: string;
      }>({
        _id: 1,
        resumeFileName: 1,
        resumeContent: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (userSessions.length === 0) return [];

    // Group sessions by résumé filename. Latest session's content wins as canonical
    // (the user may have edited the résumé between sessions on the same filename).
    const groups = new Map<
      string,
      {
        resumeContent: string;
        sessionIds: string[];
        lastUsed: string;
      }
    >();
    for (const s of userSessions) {
      const existing = groups.get(s.resumeFileName);
      if (existing) {
        existing.sessionIds.push(s._id);
        if (s.createdAt > existing.lastUsed) {
          existing.lastUsed = s.createdAt;
          existing.resumeContent = s.resumeContent;
        }
      } else {
        groups.set(s.resumeFileName, {
          resumeContent: s.resumeContent,
          sessionIds: [s._id],
          lastUsed: s.createdAt,
        });
      }
    }

    // Pull every question + every feedback for these sessions in a single query.
    const allSessionIds = Array.from(groups.values()).flatMap((g) => g.sessionIds);
    const relevantMessages = await messages
      .find({
        sessionId: { $in: allSessionIds },
        type: { $in: ["question", "feedback"] },
      })
      .sort({ createdAt: 1 })
      .toArray();

    // Bucket messages by their session, then by résumé.
    const bySessionId = new Map<string, typeof relevantMessages>();
    for (const m of relevantMessages) {
      const arr = bySessionId.get(m.sessionId) ?? [];
      arr.push(m);
      bySessionId.set(m.sessionId, arr);
    }

    const result: ResumeBankEntry[] = [];
    for (const [resumeFileName, group] of groups.entries()) {
      const questions: ResumeBankEntry["questions"] = [];
      const scores: number[] = [];
      for (const sessionId of group.sessionIds) {
        const msgs = bySessionId.get(sessionId) ?? [];
        for (const m of msgs) {
          if (m.type === "question") {
            questions.push({
              content: m.content,
              createdAt: m.createdAt,
              sessionId,
            });
          } else if (m.type === "feedback" && typeof m.feedback?.score === "number") {
            scores.push(m.feedback.score);
          }
        }
      }
      // Question list ordered chronologically across sessions.
      questions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      const averageScore =
        scores.length === 0
          ? null
          : Math.round(
              (scores.reduce((s, n) => s + n, 0) / scores.length) * 10,
            ) / 10;

      result.push({
        resumeFileName,
        resumeContent: group.resumeContent,
        sessionCount: group.sessionIds.length,
        questions,
        averageScore,
        lastUsed: group.lastUsed,
      });
    }

    // Newest résumé first.
    result.sort((a, b) => b.lastUsed.localeCompare(a.lastUsed));
    return result;
  },
};
