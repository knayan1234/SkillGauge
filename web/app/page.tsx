"use client";

/**
 * Landing page (`/`) — multi-section marketing layout.
 *
 * Phase 1.6b expansion: this page used to be just a single hero with three small cards.
 * Now it's a four-section landing tailored to walk a first-time visitor from
 * "what is this?" → "how does it work?" → "why should I use it over generic prep tools?"
 * → "let me try."
 *
 * Sections (top to bottom):
 *   1. Hero — brand mark, tagline, primary CTA. Auth-aware: anonymous → opens AuthModal,
 *      authed → routes directly to /setup with the label flipped to "Start a new session".
 *   2. How it works — three-step flow (Upload → Practice → Improve), one Card each.
 *   3. Why SkillGauge — the long-term-memory differentiator vs generic prep tools.
 *      This is the project's identity (per project_skillgauge memory + README §3) — every
 *      reviewer should leave understanding it.
 *   4. Final CTA — repeats the auth-aware action so users who scrolled don't have to
 *      scroll back.
 *
 * Design constraints:
 *   - Stays static (no client components beyond what's already here). Lighthouse perf
 *     score should remain ≥ 95.
 *   - Reuses the existing shadcn `Card` primitive — no new UI deps.
 *   - All animations use existing Tailwind classes (`animate-slide-up`, `animate-float`,
 *     `animate-pulse-glow`) so we don't grow the CSS surface.
 *
 * Auth-aware CTAs (from Phase 1.6a):
 *   - Anonymous → openAuthModal() — global modal hosted by AuthModalProvider.
 *   - Authenticated → router.push("/setup") — skip the redundant modal step for
 *     returning users.
 *   - isLoading → button disabled — avoids wrong-branch click before /me resolves.
 *
 * TODO:phase-4 add real product screenshots in the "How it works" cards (today they're
 * just icons + descriptive text). Object storage will host the images.
 * TODO:phase-2 once a real LLM is wired, the "Why" section gains a "Powered by <model>"
 * line that reads from the same /api/health/info endpoint as the badge in Phase 1.6c.
 */

import { useRouter } from "next/navigation";
import {
  Sparkles,
  Target,
  Zap,
  Brain,
  Upload,
  MessageSquare,
  TrendingUp,
  History,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { useAuthModal } from "@/components/AuthModalProvider";
import { useAuth } from "@/hooks/useAuth";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/setup");
    } else {
      openAuthModal();
    }
  };

  // Auth-aware CTA label is reused in both the hero and the final CTA — keep them in
  // sync by computing once.
  const ctaLabel = isAuthenticated ? "Start a new session" : "Get started free";

  return (
    <AppLayout>
      {/* Decorative background — fixed so it stays in place as the user scrolls.
          pointer-events-none keeps clicks falling through to the actual content. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-gradient" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* === Section 1: Hero === */}
      <section className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl animate-slide-up">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-8">
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-accent/10 flex items-center justify-center border border-primary/30 animate-pulse-glow">
                <Brain className="h-10 w-10 text-primary animate-float" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent blur-xl" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                SkillGauge
              </h1>
              <p className="text-xl text-muted-foreground">
                AI-powered interview practice that remembers, adapts, and tracks
                your growth — session after session.
              </p>
            </div>

            {/* Original three-card teaser — kept as a quick visual summary above the
                fold. The detailed sections below explain each more thoroughly. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                <Target className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h3 className="font-medium mb-1">Personalized</h3>
                <p className="text-sm text-muted-foreground">
                  Tailored to your resume
                </p>
              </Card>
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                <Sparkles className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h3 className="font-medium mb-1">AI Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time insights
                </p>
              </Card>
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                <Zap className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h3 className="font-medium mb-1">Fast Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Start in seconds
                </p>
              </Card>
            </div>

            <Button
              type="button"
              onClick={handleGetStarted}
              disabled={isLoading}
              size="lg"
              className="px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
            >
              {ctaLabel}
            </Button>

            <p className="text-xs text-muted-foreground/60 pt-4">
              No credit card required • Demo credentials provided
            </p>
          </div>
        </div>
      </section>

      {/* === Section 2: How it works ===
          Three-step flow: Upload resume → Practice in chat → See progress. Each card
          mirrors a step of the user's actual journey through the app, so a visitor who
          skims this knows what they're committing to before they sign up. */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three steps from your résumé to a deeper understanding of your
              interview strengths and gaps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Upload your résumé</h3>
              <p className="text-sm text-muted-foreground">
                Drop in a PDF or Word doc, paste the job description, and pick
                an interview style — behavioral, technical, or mixed. We handle
                the rest.
              </p>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Practice in a chat</h3>
              <p className="text-sm text-muted-foreground">
                Questions arrive one at a time, calibrated to your level. Type
                your answer; instant feedback grades it on substance, not
                length.
              </p>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Track your progress</h3>
              <p className="text-sm text-muted-foreground">
                Past sessions stay accessible as chatrooms, grouped by résumé
                and date. Re-visit any answer; watch your scores trend over
                time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* === Section 3: Why SkillGauge ===
          The differentiator vs ChatGPT-style one-shot prompts: persistent memory of
          your résumé + every prior session. This is the project's reason to exist
          (per README §3 and project_skillgauge memory). Three cards make the case. */}
      <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Why SkillGauge is different
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Generic interview prep tools forget you between sessions.
              SkillGauge treats prep as a continuous loop, not isolated quizzes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/60 backdrop-blur-sm border-primary/10">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <History className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Long-term memory</h3>
              <p className="text-sm text-muted-foreground">
                Past answers and feedback feed into future questions. Your
                weak areas surface again, harder, until they aren&apos;t weak.
              </p>
            </Card>
            <Card className="p-6 bg-card/60 backdrop-blur-sm border-primary/10">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Context-aware questions</h3>
              <p className="text-sm text-muted-foreground">
                Every prompt is built from your résumé, the target JD, and the
                style you picked. No more generic &quot;tell me about a
                time…&quot; without knowing what role you&apos;re shooting for.
              </p>
            </Card>
            <Card className="p-6 bg-card/60 backdrop-blur-sm border-primary/10">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Your data, your control</h3>
              <p className="text-sm text-muted-foreground">
                httpOnly cookie auth, hashed audit logs, single-use password
                resets, and a &quot;sign out everywhere&quot; button. Privacy
                isn&apos;t a feature — it&apos;s the floor.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* === Section 4: Final CTA ===
          Same auth-aware action as the hero, repeated for users who scrolled past it.
          Without this, returning visitors who scrolled would have to scroll back up. */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Ready to practice with a system that remembers?
          </h2>
          <p className="text-muted-foreground mb-8">
            Sign up takes seconds. The first session is free.
          </p>
          <Button
            type="button"
            onClick={handleGetStarted}
            disabled={isLoading}
            size="lg"
            className="px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
          >
            {ctaLabel}
          </Button>
        </div>
      </section>
    </AppLayout>
  );
}
