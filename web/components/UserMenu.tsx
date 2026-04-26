"use client";

/**
 * UserMenu — auth-aware affordance in the persistent header.
 *
 * Two states:
 *   - Authenticated: shows the user's email (truncated on small screens) plus a "Sign out"
 *     button. Clicking Sign out calls useAuth().logout() which:
 *       1. POSTs /api/auth/logout (server clears cookie)
 *       2. Sets the auth-query cache to null (immediate UI flip across all components)
 *       3. Calls queryClient.clear() so cached server state from the prior user can't
 *          leak into the next user's view (defense against fast user-switch bleed).
 *     Then we router.push("/") so an authenticated route (/setup, /interview) doesn't
 *     get stuck on a now-unauthenticated state — the landing page is the canonical
 *     "signed out" home.
 *
 *   - Anonymous: shows a single "Sign in" button that opens the global AuthModal via
 *     useAuthModal() (see AuthModalProvider). One AuthModal instance hosts all flows
 *     (login / register / forgot) so we never have two modals racing.
 *
 * Why this isn't a dropdown: today the menu has at most one action per state (Sign out
 * or Sign in). A dropdown for one item is more friction than affordance. When
 * "logout-all" or a future settings/profile link gets exposed in the UI, this is the
 * place to swap in a Radix DropdownMenu.
 *
 * Loading state: useAuth() is loading on first paint while /api/me is in flight. We
 * deliberately render NOTHING during loading so the header doesn't flicker between
 * "Sign in" and "Sign out" as the cache hydrates. A subtle skeleton would be a polish
 * pass — for now blank is the right default.
 *
 * TODO: wire a "Sign out everywhere" entry once a Radix DropdownMenu is added.
 * TODO: add the LLM provider badge as a sibling component in the header (interview
 * header only, not the global one — the badge is interview-specific).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "./AuthModalProvider";

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Don't render an auth affordance until we know the auth state. Avoids a flicker
  // where "Sign in" briefly appears before /me resolves and flips us to "Sign out."
  if (isLoading) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      router.push("/");
    } finally {
      // Reset flag even on error — useAuth.logout already swallows logout errors so the
      // FE state resets either way; we just keep the button enabled for retry.
      setIsSigningOut(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        {/* Email display: truncated on small screens to keep header tidy. The full
            email is in the title attribute for accessibility (hover tooltip). */}
        <span
          className="hidden md:inline text-sm text-muted-foreground max-w-[160px] truncate"
          title={user.email}
        >
          {user.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isSigningOut ? "Signing out…" : "Sign out"}
          </span>
        </Button>
      </div>
    );
  }

  // Anonymous: one "Sign in" affordance that opens the global modal.
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5"
      onClick={openAuthModal}
      aria-label="Sign in"
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign in</span>
    </Button>
  );
}
