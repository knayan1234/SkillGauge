"use client";

/**
 * LlmBadge — visible indicator of which LLM is grading the user's answers right now.
 *
 * Why it exists:
 * The stub provider returns canned questions and length-proxy scores. Without this
 * badge, a first-time user has no way to know whether they're being graded by a real
 * LLM or by a script that counts characters. That's misleading. The badge sets the
 * right expectation up front: when the chip says "stub", users know not to
 * over-interpret the feedback. When a real provider is wired, the badge auto-flips
 * to "openai · gpt-4o-mini" (or similar) with no FE code change — the endpoint
 * returns the correct values and react-query reads them.
 *
 * Data source:
 *   GET /api/health/info → { llmProvider: "stub" | "openai" | "anthropic", llmModel: string | null }
 *   Public endpoint (no auth needed). Cached with staleTime: Infinity since the value
 *   only changes on a deploy / env flip — not something the user expects to see live.
 *
 * Render shape:
 *   - Loading / errored: render nothing. The header has enough cargo without a flicker
 *     or a noisy fallback.
 *   - Loaded: small pill showing "🤖 <provider>" (with "· <model>" appended when
 *     llmModel is non-null). Hover/title shows the explanation tooltip so users can
 *     learn what "stub" means without us cluttering the badge with paragraphs of text.
 *
 * Where it's used:
 *   - InterviewHeader.tsx — interview-specific surface. Deliberately not added to the
 *     global AppLayout because the badge is most relevant during the interview itself,
 *     and a quieter global header is better UX.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { fetchHealthInfo } from "@/services/api";

// Friendly label for each provider. Centralized so future providers (e.g. Ollama,
// Bedrock) just add an entry and the badge picks it up without touching JSX.
const PROVIDER_LABEL: Record<"stub" | "openai" | "anthropic" | "gemini", string> = {
  stub: "stub",
  openai: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
};

// Hover tooltip text per provider. The "stub" tooltip is the most important — it sets
// the expectation that stub-mode grades are deterministic, not real AI evaluation.
const PROVIDER_TOOLTIP: Record<"stub" | "openai" | "anthropic" | "gemini", string> = {
  stub: "Stub provider — deterministic canned questions and length-proxy scoring. A real LLM is wired separately when its API key is configured.",
  openai: "OpenAI — questions and grading are produced by an OpenAI model.",
  anthropic: "Anthropic Claude — questions and grading are produced by a Claude model.",
  gemini: "Google Gemini — questions and grading are produced by a Gemini model. Free tier with 1M-token context.",
};

export function LlmBadge() {
  // Single shared query key across all LlmBadge instances so multiple mounts share one
  // network request. staleTime: Infinity means we fetch once per session and never refetch
  // automatically — the value is server-config-driven and changes only on deploy.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health", "info"] as const,
    queryFn: fetchHealthInfo,
    staleTime: Infinity,
    retry: false,
  });

  // On mobile the badge is icon-only — the full "gemini · gemini-2.5-flash" string
  // crowded the nav bar. Tapping the icon opens a small popover (anchored at the badge)
  // with the provider + model + explanation. Escape closes it; an invisible backdrop
  // catches outside taps.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Don't render anything until we have a confirmed value. A skeleton would clutter a
  // tight header for a low-signal indicator.
  if (isLoading || isError || !data) return null;

  const label = PROVIDER_LABEL[data.llmProvider];
  const tooltip = PROVIDER_TOOLTIP[data.llmProvider];
  // Append " · <model>" to the visible label when the endpoint returns a non-null
  // llmModel (i.e. when a real provider is configured).
  const visibleLabel = data.llmModel ? `${label} · ${data.llmModel}` : label;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Active LLM provider: ${visibleLabel}. Tap for details.`}
        title={tooltip}
        className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Bot className="h-3.5 w-3.5 flex-shrink-0" />
        {/* Text inline on sm+; hidden on mobile so only the robot icon sits in the nav.
            On mobile the model name lives in the tap-popover below. */}
        <span className="hidden sm:inline truncate max-w-[40vw] md:max-w-none">
          {visibleLabel}
        </span>
      </button>

      {open && (
        <>
          {/* Invisible backdrop — a tap anywhere outside closes the popover (mobile). */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Anchored under the badge, right-aligned so it never runs off-screen. */}
          <div
            role="dialog"
            aria-label="Active LLM provider"
            className="absolute right-0 top-full z-50 mt-1.5 w-60 max-w-[80vw] rounded-lg border border-border bg-card p-3 text-left shadow-xl"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Bot className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="break-all">{visibleLabel}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {tooltip}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
