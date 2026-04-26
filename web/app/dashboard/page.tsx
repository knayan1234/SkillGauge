"use client";

/**
 * /dashboard — personal progress overview.
 *
 * Three sections, top to bottom:
 *   1. Stats grid — total sessions, questions answered, average + best score.
 *   2. Score trend chart — every graded answer plotted over time as a line.
 *   3. Weak areas list — recurring phrases the LLM has flagged in `improvements`.
 *
 * Auth-gated. Redirects unauthenticated visitors to `/`. Hydrates from a single
 * `GET /api/dashboard/summary` call (BE handles all aggregation), so this page
 * stays a thin presentation layer.
 *
 * Why one summary endpoint, not three: every section is per-user and uses the same
 * underlying data (sessions + feedback messages). Computing all three in one BE pass
 * is cheaper than three round-trips and keeps the FE state simple.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Sparkles,
  FileText,
  ListChecks,
  Layers,
  Eye,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScoreRadial } from "@/components/ScoreRadial";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { formatRelative } from "@/lib/relativeTime";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchDashboardSummary,
  fetchResumeBank,
  type ResumeBankEntry,
} from "@/services/api";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Auth gate. Auth-loading shows a skeleton (handled below); confirmed-unauth
  // pushes to home where the user is invited to sign in.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // Dashboard reads should reflect the latest state every time the user lands on
  // this page — completing a session elsewhere should immediately bump the score
  // trend and "My Résumés" counts here. `refetchOnMount: "always"` forces a network
  // call on each navigation; `refetchOnWindowFocus` catches the case where the user
  // tabs away, runs an interview, and tabs back. Stale-time stays high so rapid
  // re-renders within the same view don't thrash the network.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "summary"] as const,
    queryFn: fetchDashboardSummary,
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // "My Résumés" data — separate query so the panel can render once it has its own
  // data without blocking on the summary aggregation. Same refresh policy as summary.
  const { data: resumeBank } = useQuery({
    queryKey: ["dashboard", "resumes"] as const,
    queryFn: fetchResumeBank,
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });

  const [openResume, setOpenResume] = useState<ResumeBankEntry | null>(null);
  const [openQuestionBank, setOpenQuestionBank] = useState<ResumeBankEntry | null>(
    null,
  );

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </AppLayout>
    );
  }

  if (isError || !data) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <EmptyState
            icon={Sparkles}
            title="Couldn't load your dashboard"
            description="Try a hard refresh. If this persists, the backend may be unreachable."
          />
        </div>
      </AppLayout>
    );
  }

  const { stats, scoreTrend, weakAreas } = data;
  // Defensive: if the BE is on a stale build that hasn't shipped `styleBreakdown` yet,
  // treat it as empty so the dashboard renders the rest of the page instead of crashing
  // on `styleBreakdown.behavioral`. Same defence for any new field the BE may not yet
  // be returning — the dashboard surfaces should never block on partial payloads.
  const styleBreakdown = data.styleBreakdown ?? {
    behavioral: 0,
    technical: 0,
    mixed: 0,
  };
  const totalStyleSessions =
    styleBreakdown.behavioral + styleBreakdown.technical + styleBreakdown.mixed;

  // Format trend data for recharts. The X-axis tick uses the ISO date trimmed to
  // YYYY-MM-DD; the tooltip shows the full timestamp. Score binned to integer
  // because the rubric is an integer 1–10.
  const trendData = scoreTrend.map((p) => ({
    date: p.at.slice(0, 10),
    score: p.score,
  }));

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8 stagger-fade">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Your progress</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A glance at where your interview prep stands.
          </p>
        </header>

        {/* Stats grid — four cards. Average score uses the radial gauge for a quick
            visual; the rest are big-number cards. */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Sessions" value={stats.totalSessions.toString()} />
          <StatCard
            label="Questions answered"
            value={stats.totalQuestionsAnswered.toString()}
          />
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              {stats.averageScore !== null ? (
                <ScoreRadial score={Math.round(stats.averageScore)} size={56} />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted/60" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-lg font-semibold text-foreground">
                  {stats.averageScore !== null
                    ? stats.averageScore.toFixed(1)
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <StatCard
            label="Best score"
            value={
              stats.bestScore !== null ? stats.bestScore.toString() : "—"
            }
          />
        </section>

        {/* Practice mix — distribution across interview styles. Always-render with an
            empty state when the user has zero sessions, so the panel surfaces the
            feature even before they've practiced anything. */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="icon-tile">
                  <span className="icon-tile-inner inline-flex h-6 w-6 items-center justify-center">
                    <Layers
                      className="h-3.5 w-3.5 text-primary"
                      aria-hidden="true"
                    />
                  </span>
                </span>
                Practice mix
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalStyleSessions === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Run a session to see your practice spread across behavioral,
                  technical, and mixed interviews.
                </p>
              ) : (
                <ul className="space-y-3">
                  {(
                    [
                      ["behavioral", "Behavioral"],
                      ["technical", "Technical"],
                      ["mixed", "Mixed"],
                    ] as const
                  ).map(([key, label]) => {
                    const count = styleBreakdown[key];
                    const pct = Math.round((count / totalStyleSessions) * 100);
                    return (
                      <li
                        key={key}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-24 shrink-0 text-foreground">
                          {label}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent-2 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
                          {count} {count === 1 ? "session" : "sessions"} · {pct}
                          %
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* My Résumés — one entry per distinct résumé filename the user has uploaded.
            Always-render. Empty state when no sessions; otherwise list with View résumé
            + Question bank actions. Backs the "no repeats" claim concretely. */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="icon-tile">
                  <span className="icon-tile-inner inline-flex h-6 w-6 items-center justify-center">
                    <FileText
                      className="h-3.5 w-3.5 text-primary"
                      aria-hidden="true"
                    />
                  </span>
                </span>
                My résumés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!resumeBank || resumeBank.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Upload a résumé in your first session and it&apos;ll appear
                  here. Each résumé carries its own question bank — every
                  question we&apos;ve ever asked of it, never repeated.
                </p>
              ) : (
                <ul className="space-y-3">
                  {resumeBank.map((r) => (
                    <li
                      key={r.resumeFileName}
                      className="lift-card rounded-md border border-border/60 bg-muted/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {r.resumeFileName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.sessionCount}{" "}
                            {r.sessionCount === 1 ? "session" : "sessions"} ·{" "}
                            {r.questions.length} unique question
                            {r.questions.length === 1 ? "" : "s"} ·{" "}
                            {r.averageScore !== null
                              ? `${r.averageScore.toFixed(1)} avg`
                              : "no score yet"}{" "}
                            · last used {formatRelative(r.lastUsed)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenResume(r)}
                            className="gap-1.5"
                            aria-label={`View résumé content for ${r.resumeFileName}`}
                          >
                            <Eye
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            View résumé
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenQuestionBank(r)}
                            className="gap-1.5"
                            aria-label={`Open question bank for ${r.resumeFileName}`}
                          >
                            <ListChecks
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Question bank
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Score trend — line chart of every graded answer over time. ResponsiveContainer
            handles widths; the height is fixed so the layout doesn't reflow on data load. */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="icon-tile">
                  <span className="icon-tile-inner inline-flex h-6 w-6 items-center justify-center">
                    <TrendingUp
                      className="h-3.5 w-3.5 text-primary"
                      aria-hidden="true"
                    />
                  </span>
                </span>
                Score trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No graded answers yet"
                  description="Complete a few interview questions to see your score trend over time."
                  className="py-6"
                />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis
                        domain={[0, 10]}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Weak areas — top recurring phrases from feedback.improvements. Frequency
            count drawn as bars whose width scales with count relative to the max. */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="icon-tile">
                  <span className="icon-tile-inner inline-flex h-6 w-6 items-center justify-center">
                    <Sparkles
                      className="h-3.5 w-3.5 text-amber-500"
                      aria-hidden="true"
                    />
                  </span>
                </span>
                Recurring areas to improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakAreas.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Not enough signal yet"
                  description="Complete more graded answers and we'll surface the topics that come up most often in your feedback."
                  className="py-6"
                />
              ) : (
                <ul className="space-y-2">
                  {(() => {
                    const max = Math.max(...weakAreas.map((w) => w.count));
                    return weakAreas.map((w) => (
                      <li
                        key={w.phrase}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-32 shrink-0 truncate text-foreground capitalize">
                          {w.phrase}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full bg-yellow-500/70"
                            style={{ width: `${(w.count / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {w.count}
                        </span>
                      </li>
                    ));
                  })()}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Résumé content viewer */}
      <Dialog
        open={openResume !== null}
        onOpenChange={(open) => !open && setOpenResume(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {openResume?.resumeFileName ?? "Résumé"}
            </DialogTitle>
            <DialogDescription>
              Parsed text the LLM grades against. Update or replace by uploading
              a fresh résumé in your next session.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap font-mono">
            {openResume?.resumeContent ?? "Resume content not available."}
          </div>
        </DialogContent>
      </Dialog>

      {/* Question bank — every question ever asked of this résumé, in order. */}
      <Dialog
        open={openQuestionBank !== null}
        onOpenChange={(open) => !open && setOpenQuestionBank(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate">
              <ListChecks
                className="h-4 w-4 text-primary flex-shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">
                Question bank — {openQuestionBank?.resumeFileName ?? "résumé"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {openQuestionBank?.questions.length ?? 0} unique question
              {openQuestionBank?.questions.length === 1 ? "" : "s"} asked across{" "}
              {openQuestionBank?.sessionCount ?? 0} session
              {openQuestionBank?.sessionCount === 1 ? "" : "s"}. Future questions
              skip everything in this list — the system never repeats itself.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-1">
            {openQuestionBank && openQuestionBank.questions.length > 0 ? (
              <ol className="divide-y divide-border/40">
                {openQuestionBank.questions.map((q, i) => (
                  <li
                    key={`${q.sessionId}-${i}`}
                    className="px-3 py-2.5 text-sm text-foreground"
                  >
                    <span className="font-mono text-[10px] font-semibold text-primary/60 mr-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {q.content}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                No questions logged yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
