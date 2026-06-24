"use client";

/**
 * /sessions — the authenticated landing page.
 *
 * Two-pane layout:
 *   - Left rail: chatroom history grouped by résumé → day, clickable to load into the
 *     interview view. Powered by the same `GET /api/sessions` data as the in-interview
 *     sidebar; same grouping helpers from `lib/sessionGrouping.ts`.
 *   - Main panel: welcome card + prominent "Start a new interview" CTA + a recent-activity
 *     summary strip. Designed so a returning user sees their last few sessions at a glance
 *     and can either resume one or start fresh in a single click.
 *
 * Auth gate: unauth visitors get bounced to `/`. Loading state is the AppLayout skeleton —
 * we deliberately don't show a 50/50 layout flicker before auth resolves.
 *
 * Why a separate route from `/`:
 *   - `/` stays a Server Component marketing page for first-time visitors and SEO.
 *   - `/sessions` is auth-gated and dynamic (per-user data) — naturally a client route.
 *   - Login flow now redirects here, so the first thing a returning user sees is their
 *     own work + a clear next-action CTA.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import { InterviewLayout } from "@/components/InterviewLayout";
import { SessionsHistorySidebar } from "@/features/sessions-list/SessionsHistorySidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLink } from "@/components/BrandLink";
import { HeaderNav } from "@/components/HeaderNav";
import { useAuth } from "@/hooks/useAuth";
import { listSessions, fetchDashboardSummary } from "@/services/api";

export default function SessionsLandingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", "list"] as const,
    queryFn: listSessions,
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  const { data: summary } = useQuery({
    queryKey: ["dashboard", "summary"] as const,
    queryFn: fetchDashboardSummary,
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  if (authLoading || !isAuthenticated) {
    return (
      <InterviewLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </InterviewLayout>
    );
  }

  const totalSessions = summary?.stats.totalSessions ?? sessions.length;
  const avgScore = summary?.stats.averageScore;
  const bestScore = summary?.stats.bestScore;
  const greeting = user?.email ? user.email.split("@")[0] : "there";

  return (
    <InterviewLayout
      sidebar={<SessionsHistorySidebar />}
      header={
        // Workspace header — uses the same BrandLink + HeaderNav primitives as
        // AppLayout so the chrome reads identically on every page. Tiny breadcrumb-
        // style "Your workspace" label after the brand keeps the page identity
        // without breaking the shared layout.
        <div className="h-full flex items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLink />
            <span
              aria-hidden="true"
              className="hidden sm:block h-5 w-px bg-border/80"
            />
            <p className="hidden sm:block text-sm text-muted-foreground truncate">
              Your workspace
            </p>
          </div>
          <HeaderNav />
        </div>
      }
    >
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-20 space-y-12">
          {/* Welcome */}
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Welcome back,{" "}
              <span className="font-medium text-foreground">{greeting}</span>.
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              Ready for your{" "}
              <span className="animate-gradient-text">next interview</span>?
            </h1>
            <p className="text-base text-muted-foreground max-w-xl">
              Start a fresh session, or pick up an old chatroom from the sidebar.
            </p>
          </div>

          {/* Primary CTA — neutral card surface (faint cool gradient) with the amber
              button as the lone warm accent. The brand-frame halo we tried wrapping
              around this was too much amber stacked on amber-button — the card now
              reads as "calm container, hot action" which is the right hierarchy. */}
          <Card className="group relative overflow-hidden p-8 bg-card border border-border/70 transition-all duration-500 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/[0.04]">
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
                    New session
                  </p>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Start a fresh interview
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload a résumé, paste a job description, pick a style — and
                  begin practicing in under a minute.
                </p>
              </div>
              <Button
                size="lg"
                // Amber primary CTA — workspace's most prominent action. Same amber
                // gradient as the home-page HeroCta so first-action affordances share
                // a visual identity across pages.
                className="self-start md:self-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-500/90 hover:to-amber-600/90 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 transition-all"
                onClick={() => router.push("/setup")}
              >
                Start new session
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </Card>

          {/* Quick stats — only show once the user has data */}
          {totalSessions > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  At a glance
                </p>
                <Link
                  href="/dashboard"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Full dashboard <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Sessions"
                  value={String(totalSessions)}
                  hint="completed + in progress"
                />
                <StatCard
                  label="Average score"
                  value={avgScore != null ? avgScore.toFixed(1) : "—"}
                  hint="out of 10"
                />
                <StatCard
                  label="Best score"
                  value={bestScore != null ? bestScore.toFixed(1) : "—"}
                  hint="all-time high"
                />
              </div>
            </div>
          )}

          {/* Empty state — first-time users with no sessions yet */}
          {sessions.length === 0 && (
            <Card className="p-6 border-dashed bg-muted/30">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">
                    No sessions yet — you&apos;re a few clicks away from your
                    first one.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tap &ldquo;Start new session&rdquo; above. Your past chats
                    will appear in the sidebar after each interview ends.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </InterviewLayout>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="p-5 hover:border-amber-500/30 transition-colors">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      {/* Amber stat values — same accent that runs through the brand-frame halo +
          home-page step numbers. Reads as "the headline number" against the muted
          label above it; pairs warmly with the blue UI primary used elsewhere. */}
      <p className="text-3xl font-bold text-amber-500 tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground/70 mt-1">{hint}</p>
    </Card>
  );
}
