"use client";

/**
 * HeaderNav — the canonical right-side cluster of header actions, used by both the
 * AppLayout (home / setup / reset / dashboard pages) and the workspace + interview
 * shells. Single source of truth so the header feels identical across every route.
 *
 * Three semantic groups separated by thin vertical dividers:
 *
 *   1. Nav        — auth-gated routes (Dashboard). Active state: amber underline +
 *                   foreground text colour, with `aria-current="page"`.
 *   2. Identity   — `<UserMenu>` (email + Sign out / Sign in)
 *   3. Preference — `<ThemeToggle>` (light/dark)
 *
 * Group separators communicate that these are different classes of action — not
 * peers — without taking visual weight from any single item.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/hooks/useAuth";

export function HeaderNav() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  return (
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
  );
}

/**
 * HeaderDivider — thin vertical separator between header action groups. Hidden on
 * very small viewports where the cluster wraps; the gap-1 on the container still
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
