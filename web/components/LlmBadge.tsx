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

import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { fetchHealthInfo } from "@/services/api";

// Friendly label for each provider. Centralized so future providers (e.g. Ollama,
// Bedrock) just add an entry and the badge picks it up without touching JSX.
const PROVIDER_LABEL: Record<"stub" | "openai" | "anthropic", string> = {
  stub: "stub",
  openai: "openai",
  anthropic: "anthropic",
};

// Hover tooltip text per provider. The "stub" tooltip is the most important — it sets
// the expectation that stub-mode grades are deterministic, not real AI evaluation.
const PROVIDER_TOOLTIP: Record<"stub" | "openai" | "anthropic", string> = {
  stub: "Stub provider — deterministic canned questions and length-proxy scoring. A real LLM is wired separately when its API key is configured.",
  openai: "OpenAI — questions and grading are produced by an OpenAI model.",
  anthropic: "Anthropic Claude — questions and grading are produced by a Claude model.",
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

  // Don't render anything until we have a confirmed value. A skeleton would clutter a
  // tight header for a low-signal indicator.
  if (isLoading || isError || !data) return null;

  const label = PROVIDER_LABEL[data.llmProvider];
  const tooltip = PROVIDER_TOOLTIP[data.llmProvider];
  // Append " · <model>" to the visible label when the endpoint returns a non-null
  // llmModel (i.e. when a real provider is configured).
  const visibleLabel = data.llmModel ? `${label} · ${data.llmModel}` : label;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary"
      title={tooltip}
      aria-label={`Active LLM provider: ${visibleLabel}`}
    >
      <Bot className="h-3.5 w-3.5" />
      {visibleLabel}
    </span>
  );
}
