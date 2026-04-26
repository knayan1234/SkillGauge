"use client";

/**
 * BrandLink — the canonical "go home / back to landing" affordance: the SkillGauge
 * logo tile + the gradient wordmark, packaged as a button.
 *
 * One source of truth so the header looks identical across every shell that hosts
 * it (AppLayout, the workspace InterviewLayout, the interview page header).
 *
 * Visual structure:
 *   - `brand-frame` halo around the SkillGaugeLogo tile (animated amber sweep).
 *   - "SkillGauge" wordmark with an amber-spectrum gradient (deeper → standard →
 *     lighter amber) clipped to the text — reads as one continuous brand, not as
 *     a "Skill + Gauge" split.
 *   - Hover state: subtle amber-tinted background + scale transition so the whole
 *     thing feels like a real CTA, not just static text.
 */

import { useRouter } from "next/navigation";
import { SkillGaugeLogo } from "./SkillGaugeLogo";

interface BrandLinkProps {
  /**
   * Optional layout-side overrides (e.g., to tweak gap or padding). Keep typography
   * + colour decisions inside this component so every consumer stays in sync.
   */
  className?: string;
}

export function BrandLink({ className = "" }: BrandLinkProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      aria-label="SkillGauge home"
      className={`group flex items-center gap-2.5 px-2 py-1 -mx-2 rounded-lg transition-all duration-200 hover:bg-amber-500/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <div className="brand-frame rounded-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
        <div className="brand-frame-inner h-10 w-10 rounded-lg flex items-center justify-center">
          <SkillGaugeLogo size={24} className="text-amber-700" />
        </div>
      </div>
      {/* Wordmark — uppercase + extra-bold + wider tracking gives the brand real
          presence in the header. The amber gradient stays so the wordmark has the
          warm signature. Slightly larger size (xl) makes it a clear focal point. */}
      <span className="text-xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-800 via-amber-600 to-amber-500 dark:from-amber-400 dark:via-amber-300 dark:to-amber-200 bg-clip-text text-transparent">
        SkillGauge
      </span>
    </button>
  );
}
