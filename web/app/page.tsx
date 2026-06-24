/**
 * Landing page (`/`) — public marketing page served as a Server Component.
 *
 * Layout: hero + compact "how it works" row + weighted footer. Designed to fit a typical
 * desktop viewport without scrolling, but uses `min-h` not `h-` so content gracefully
 * scrolls on very short viewports rather than getting clipped. Static content only —
 * Next pre-renders the markup; the auth-aware CTA + UserMenu are client islands.
 */

import { AppLayout } from "@/components/AppLayout";
import { HeroCta } from "@/components/HeroCta";
import { SiteFooter } from "@/components/SiteFooter";
import { SkillGaugeLogo } from "@/components/SkillGaugeLogo";

export default function LandingPage() {
  return (
    <AppLayout>
      {/* Sticky-footer layout: main flexes to fill, footer sits at the bottom. The
          `min-h` (not `h-`) lets very short viewports scroll instead of clipping. */}
      <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 py-10 md:py-14">
          <div className="w-full max-w-3xl space-y-10 md:space-y-12 animate-slide-up">
            {/* Hero block */}
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="brand-frame rounded-2xl">
                  <div className="brand-frame-inner h-12 w-12 rounded-2xl flex items-center justify-center">
                    <SkillGaugeLogo size={28} className="text-amber-700" />
                  </div>
                </div>
              </div>

              <h1 className="text-center text-balance text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] md:leading-[1.05]">
                Interview practice,{" "}
                <span className="animate-gradient-text">built around you.</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Add your resume and a job description. Walk through a structured
                mock interview — each answer scored, weak spots queued for the
                next round.
              </p>

              <div className="flex flex-col items-center gap-2 pt-1">
                <HeroCta />
                <p className="text-xs text-muted-foreground/70">
                  Free to try · No credit card · Your data stays yours
                </p>
              </div>
            </div>

            {/* How it works — compact horizontal row, no Card chrome */}
            <div className="pt-6 md:pt-8 border-t border-border/40">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-primary/70 text-center mb-5 md:mb-6">
                How it works
              </p>
              <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="space-y-1.5">
                    <span
                      className="text-xs font-mono font-semibold text-amber-500 tracking-widest"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-sm md:text-base font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </AppLayout>
  );
}

const STEPS = [
  {
    title: "Add your résumé and the role",
    body: "PDF or DOCX, the job description, and an interview style. About a minute.",
  },
  {
    title: "Run a structured mock",
    body: "Questions arrive one at a time, calibrated to your level. Each answer scored and explained.",
  },
  {
    title: "Come back stronger",
    body: "Past sessions stay accessible. Retry any answer; weak spots drive the next round.",
  },
];
