"use client";

/**
 * Auth-aware "Get started" CTA. Used in both the hero and the final CTA section
 * of the landing page.
 *
 * The interactive bits (auth state, modal opener, router) require client APIs, so
 * this is the small client island within the otherwise-static landing page. Keeping
 * the marketing content as Server Components shrinks the page's client JS bundle.
 *
 * Behaviour:
 *   - Anonymous → opens the global AuthModal.
 *   - Authenticated → routes to /setup.
 *   - While `isLoading` (auth probe in flight) → button is disabled to avoid
 *     wrong-branch click before the resolution lands.
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/components/AuthModalProvider";

interface HeroCtaProps {
  // Optional className for layout-side overrides; the variant + sizing stay constant
  // so both call sites look identical.
  className?: string;
}

export function HeroCta({ className }: HeroCtaProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const router = useRouter();

  const onClick = () => {
    // Auth users land on the sessions workspace, not directly in setup, so they see
    // their chat history first and can choose to resume an old chatroom or start fresh.
    if (isAuthenticated) router.push("/sessions");
    else openAuthModal();
  };

  const label = isAuthenticated ? "Open my workspace" : "Get started free";

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      size="lg"
      className={
        className ??
        // Amber-gradient hero CTA — the most prominent "do this now" action surface
        // on the marketing page. Pushed to amber instead of primary blue because the
        // hero is the brand moment; amber is the brand accent. Blue stays the
        // workhorse on dense interactive surfaces (focus rings, links, charts).
        "px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-500/90 hover:to-amber-600/90 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/40"
      }
    >
      {label}
    </Button>
  );
}
