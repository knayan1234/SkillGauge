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
import { BarChart3 } from "lucide-react";
import { BrandLink } from "./BrandLink";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { SiteFooter } from "./SiteFooter";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Dashboard link is auth-gated; brand-link routing is owned by `<BrandLink />`.
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  return (
    <div className="min-h-dvh bg-background">
      {/* === Header — designed as three balanced regions ============================
       *
       *   [ BrandLink ]                                                  [ right cluster ]
       *
       *   The right cluster is grouped into three sub-clusters separated by thin
       *   vertical dividers, each with a clear semantic role:
       *
       *     1. Nav          — auth-gated routes (Dashboard). Active state: amber
       *                       underline + foreground text colour.
       *     2. Identity     — `<UserMenu>` (email + Sign out / Sign in)
       *     3. Preference   — `<ThemeToggle>` (light/dark)
       *
       *   Group separators communicate that these aren't peers — they're different
       *   classes of action — without taking visual weight from any single item.
       *
       *   Padding bumped from h-14 → h-16 and px-4 → px-5/8 for breathing room that
       *   feels intentional rather than cramped.
       * ========================================================================= */}
      <header className="header-surface fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <BrandLink />

          <nav
            aria-label="Primary"
            className="flex items-center gap-1 sm:gap-2"
          >
            {/* --- Group 1: Nav -------------------------------------------------- */}
            {!authLoading && isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  aria-current={onDashboard ? "page" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                    onDashboard
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-amber-500/10"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Dashboard</span>
                  {/* Active-page underline — amber bar that anchors the current
                      page. Animates in on route change so the nav reads as a
                      live state, not just static text. */}
                  {onDashboard && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-0.5 left-2.5 right-2.5 h-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                    />
                  )}
                </Link>
                <HeaderDivider />
              </>
            )}

            {/* --- Group 2: Identity --------------------------------------------- */}
            <UserMenu />

            {/* --- Group 3: Preference ------------------------------------------- */}
            <HeaderDivider />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main area sits below the fixed header. h-16 header → pt-16 main. */}
      <main className="pt-16">{children}</main>

      {/* Compact footer on every non-home page (setup / reset / dashboard). Home renders
          its own full SiteFooter in-page, so skip it here to avoid doubling up. */}
      {pathname !== "/" && <SiteFooter variant="compact" />}
    </div>
  );
}

/**
 * HeaderDivider — thin vertical separator between the header's action groups.
 * Hidden on very small viewports where the right cluster wraps; the gap-1 still
 * communicates the grouping.
 */
function HeaderDivider() {
  return (
    <span
      aria-hidden="true"
      className="hidden sm:block h-5 w-px bg-border/80 mx-1"
    />
  );
}
