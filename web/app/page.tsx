"use client";

/**
 * Landing page (`/`) — the marketing hero + auth-aware CTA.
 *
 * Phase 1.6a refactor: dropped the local `useState` + `<AuthModal>` host. The modal now
 * lives in the global AuthModalProvider (see app/providers.tsx). The "Get started free"
 * CTA branches on `isAuthenticated`:
 *   - Anonymous → opens the global AuthModal via `useAuthModal().open()`
 *   - Authenticated → routes to `/setup` directly (skip the redundant modal step)
 *
 * TODO:phase-1.6b expand this page beyond the single hero into a multi-section landing
 * (what / how / why) per the user's "homepage detail" requirement.
 */

import { useRouter } from "next/navigation";
import { Sparkles, Target, Zap, Brain } from "lucide-react";
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

  return (
    <AppLayout>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-gradient" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
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
                AI-powered interview practice
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                <Target className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h3 className="font-medium mb-1">Personalized</h3>
                <p className="text-sm text-muted-foreground">
                  Tailored to your resume
                </p>
              </Card>
              <Card
                className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                style={{ animationDelay: "0.1s" }}
              >
                <Sparkles className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h3 className="font-medium mb-1">AI Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time insights
                </p>
              </Card>
              <Card
                className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                style={{ animationDelay: "0.2s" }}
              >
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
              {/* Auth-aware label so a returning user sees the right next-step verb. */}
              {isAuthenticated ? "Start a new session" : "Get started free"}
            </Button>

            <p className="text-xs text-muted-foreground/60 pt-4">
              No credit card required • Simple demo credentials provided
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
