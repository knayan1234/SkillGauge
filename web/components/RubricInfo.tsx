"use client";

/**
 * RubricInfo — a small "?" button that opens a dialog explaining how the score
 * for any given answer is calculated. Surfaces the grading model so end users
 * understand what the number means rather than treating it as a black box.
 *
 * Rendered next to every score on feedback bubbles + on the dashboard's
 * "Recurring areas to improve" panel. Reads from `useQuery(["health","info"])`
 * indirectly via the LlmBadge's same source — not stateful here; it just shows
 * both branches (real-LLM rubric vs. stub-mode length proxy) so users see what
 * mode they're in.
 */

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RubricInfoProps {
  /** Optional class for layout-side overrides on the trigger button. */
  className?: string;
}

export function RubricInfo({ className = "" }: RubricInfoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How is this scored?"
        title="How is this scored?"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-muted-foreground/60 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className}`}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg tracking-tight">
              How is this scored?
            </DialogTitle>
            <DialogDescription>
              Two grading paths depending on which LLM provider is active.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm leading-relaxed pt-2">
            <section className="section-accent space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                Real-LLM mode (Gemini, OpenAI, or Anthropic)
              </h3>
              <p>
                The model is asked to grade your answer on a 1–10 rubric, weighted
                across four dimensions:
              </p>
              <ul className="space-y-1.5 mt-2 text-foreground/90">
                <li className="flex justify-between gap-3 border-b border-border/40 pb-1">
                  <span className="font-medium">Correctness</span>
                  <span className="text-muted-foreground tabular-nums">40%</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-border/40 pb-1">
                  <span className="font-medium">Depth</span>
                  <span className="text-muted-foreground tabular-nums">30%</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-border/40 pb-1">
                  <span className="font-medium">Clarity</span>
                  <span className="text-muted-foreground tabular-nums">20%</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="font-medium">Structure</span>
                  <span className="text-muted-foreground tabular-nums">10%</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground pt-1">
                The model also returns specific strengths + improvements for the
                answer, which appear as bullets under your score.
              </p>
            </section>

            <section className="section-accent space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                Stub mode (default — no API key configured)
              </h3>
              <p>
                Without an LLM provider set, scoring uses a deterministic
                length-proxy heuristic: longer, more substantive-feeling answers
                score higher (capped at 8/10), with small modifiers per interview
                style. It&apos;s a placeholder so the FE flow is visible without
                paying for an API — not a real evaluation. To switch to real
                grading, add a Gemini key (free) and flip{" "}
                <code className="text-[11px] bg-muted/60 rounded px-1 font-mono">
                  LLM_PROVIDER=gemini
                </code>{" "}
                in <code className="text-[11px] bg-muted/60 rounded px-1 font-mono">backend/.env</code>.
              </p>
            </section>

            <section className="section-accent space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                Why scoring matters here
              </h3>
              <p>
                The number isn&apos;t the point — the feedback is. Each score
                comes with what was missing and what to say next time, and your
                weak spots are written into the system so they resurface in later
                rounds, harder. The score is just a way to track whether you&apos;re
                actually improving across sessions.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
