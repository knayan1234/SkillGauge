"use client";

/**
 * AppLayout — the persistent shell on every non-interview route (`/`, `/setup`, `/reset`).
 *
 * Hosts:
 *   - Brand mark (left): clickable, routes to `/`.
 *   - UserMenu (right): auth-aware Sign in / Sign out affordance backed by the global
 *     AuthModalProvider so any route can trigger sign-in without prop drilling.
 *   - ThemeToggle (right): light/dark/system via next-themes.
 *
 * The InterviewHeader (separate file) replicates the right-side cluster so the interview
 * shell shows the same affordances. Both render `<UserMenu />` so behavior stays in sync.
 */

import { type ReactNode } from "react";
import { Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Go home"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              SkillGauge
            </span>
          </button>
          <div className="flex items-center gap-2">
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="pt-14">{children}</main>
    </div>
  );
}
