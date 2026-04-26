"use client";

/**
 * SiteFooter — weighted footer with an About dialog for substantive copy.
 *
 * Why a dialog rather than a long footer / separate page:
 *   1. The landing page is designed to fit in one viewport. A long footer or new section
 *      would break that. A dialog keeps the visible page clean.
 *   2. Anyone who wants the full story can read it without leaving the home page —
 *      one click to open, one click to close.
 *   3. Keeps the surface small for first-time visitors (no wall of text above the fold)
 *      while still being available to anyone who wants depth.
 *
 * Three signals make the footer read as an intentional page boundary rather than a stray
 * tagline: distinct background tint, clear left/right structure, and two-line attribution
 * stacks on each side that give it enough vertical mass to anchor the page.
 */

import { useState } from "react";
import {
  FileText,
  Layers,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  Send,
  Code2,
} from "lucide-react";
import { SkillGaugeLogo } from "./SkillGaugeLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const BUILD_YEAR = new Date().getFullYear();
const AUTHOR_EMAIL = "kumarnayan.work@gmail.com";

export function SiteFooter() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [authorOpen, setAuthorOpen] = useState(false);

  return (
    <>
      {/* Footer — `footer-surface` is the glassmorphic mirror of the header. Same
          translucent fill + backdrop-blur + saturation, with the highlight border on
          top instead of the bottom. */}
      <footer className="footer-surface" role="contentinfo">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          {/* Top row: brand on the left, attribution on the right. Stacks centered on
              very small viewports so each block stays legible. */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="brand-frame rounded-lg flex-shrink-0">
                <div className="brand-frame-inner h-7 w-7 rounded-lg flex items-center justify-center">
                  <SkillGaugeLogo size={16} className="text-amber-700" />
                </div>
              </div>
              <div className="leading-tight text-center sm:text-left">
                <p className="text-sm font-semibold text-foreground">
                  SkillGauge
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Personal interview rehearsal
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center sm:text-right leading-tight">
              Built by{" "}
              <button
                type="button"
                onClick={() => setAuthorOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={authorOpen}
                className="text-foreground font-medium hover:text-primary transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                Kumar Nayan
              </button>
              <br className="hidden sm:inline" />
              <span className="text-muted-foreground/60">
                © {BUILD_YEAR} · A personal project
              </span>
            </p>
          </div>

          {/* Thin centered nav row — visually separated from the attribution stack
              above so "About" reads as a real footer link, not a stray button wedged
              between brand and copyright. Border-t connects it to the row above. */}
          <nav
            aria-label="Footer"
            className="mt-3 sm:mt-4 pt-3 border-t border-border/40 flex items-center justify-center gap-4 text-xs"
          >
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={aboutOpen}
              className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
            >
              About SkillGauge
            </button>
            <span aria-hidden="true" className="text-muted-foreground/40">
              ·
            </span>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={contactOpen}
              className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
            >
              Contact
            </button>
          </nav>
        </div>
      </footer>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="brand-frame rounded-xl flex-shrink-0">
                <div className="brand-frame-inner h-10 w-10 rounded-xl flex items-center justify-center">
                  <SkillGaugeLogo size={22} className="text-amber-700" />
                </div>
              </div>
              <DialogTitle className="text-2xl tracking-tight">
                About{" "}
                <span className="animate-gradient-text">SkillGauge</span>
              </DialogTitle>
            </div>
            <DialogDescription>
              Interview preparation, treated as a continuous loop instead of
              isolated quizzes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-sm leading-relaxed pt-2">
            <Section title="What it is" icon={<FileText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              SkillGauge is an interview practice tool built around the role
              you&apos;re actually applying for. You drop in a résumé and a job
              description; it reads both, assembles a question generator
              grounded in your real background, and walks you through a
              structured mock interview. Every answer is graded with specific
              feedback you can act on — what was missing, what to say next
              time, what the model would have wanted to hear. The system
              remembers what you struggled with, so the questions you fumble
              today resurface in later rounds until you&apos;ve genuinely
              worked through them.
            </Section>

            <Section title="Why this is different" icon={<Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              <p className="mb-3">
                Most interview prep is one-shot. Generic question banks.
                Quizzes that reset every visit. They don&apos;t know who you
                are, what role you want, or what you got wrong yesterday.
                SkillGauge takes the opposite stance — your prep is a
                continuing record, not a series of disposable practice runs.
              </p>
              <ul className="space-y-3 pl-1">
                <Bullet label="Grounded in your context.">
                  Every prompt references your actual résumé bullets and the
                  target job description. Questions push on the parts that
                  matter for the role you&apos;re targeting — not the same
                  &ldquo;tell me about a time you showed leadership&rdquo; ten
                  thousand other candidates have already heard.
                </Bullet>
                <Bullet label="Specific, scorable feedback.">
                  Answers are evaluated for substance and clarity, not length.
                  Each grade comes with what was missing, what worked, and
                  what to say next time. No generic encouragement, no
                  &ldquo;great answer&rdquo; filler.
                </Bullet>
                <Bullet label="Continuity across sessions.">
                  Your weak spots are written into the system. The questions
                  you struggle with today come back tomorrow, calibrated to
                  where you fumbled. Later rounds raise the difficulty and
                  target the gaps. Practice compounds.
                </Bullet>
                <Bullet label="Your workspace, your pace.">
                  Past chatrooms stay accessible, organized by résumé and
                  date. Retry any answer. Open old sessions to compare. Run
                  multiple résumés in parallel — separate roles, separate
                  histories, all in one place.
                </Bullet>
              </ul>
            </Section>

            <Section title="How a session goes" icon={<Layers className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              You add a résumé (PDF or DOCX) and a job description, then pick
              an interview style — behavioral, technical, or mixed — and a
              difficulty level. The system parses your résumé, builds a
              question generator from both documents, and asks you one
              question at a time. You answer in chat. Each answer is graded
              with a numeric score and written feedback. When the round
              finishes, you can retry any question, start the next round at
              higher difficulty, or close the session and pick it up another
              day. Everything is saved.
            </Section>

            <Section title="Privacy stance" icon={<ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              SkillGauge stores your résumé content, job descriptions, and
              answer transcripts so the system can give you continuity across
              sessions — that&apos;s the whole point. Nothing is shared with
              third parties; there&apos;s no analytics tracking, no
              advertising, no data brokerage. If you want to walk away, the
              email link in the footer works for delete requests.
            </Section>

            <Section title="Made by" icon={<User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              Kumar Nayan (
              <a
                href="mailto:kumarnayan.work@gmail.com"
                className="text-primary hover:underline underline-offset-2"
              >
                kumarnayan.work@gmail.com
              </a>
              ) — {BUILD_YEAR}. SkillGauge is a personal project, built
              end-to-end by one person. It&apos;s not a SaaS, not a startup,
              not collecting metrics for anyone. The intent is a tool
              that&apos;s actually useful when you&apos;re preparing for the
              next role you want — not another generic prep platform that
              forgets you between visits.
            </Section>
          </div>
        </DialogContent>
      </Dialog>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <AuthorDialog open={authorOpen} onOpenChange={setAuthorOpen} />
    </>
  );
}

/**
 * ContactDialog — casual reach-out form. The form doesn't POST anywhere; on submit
 * we construct a mailto: URL with the user's intent baked into the body and let the
 * browser hand it to their default mail client. No server, no API key, nothing to
 * deploy. The user is in control of actually sending the email — we just pre-fill it.
 */
interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("Feedback");
  const [message, setMessage] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setReason("Feedback");
    setMessage("");
  };

  const handleSend = () => {
    // Build the mailto body with the form fields. Real form validation is light —
    // we trust the mail client to surface "missing fields" once the user gets there.
    const subject = `[SkillGauge] ${reason} from ${name || "a visitor"}`;
    const body = [
      `From: ${name || "(unnamed)"}${email ? ` <${email}>` : ""}`,
      `Reason: ${reason}`,
      "",
      message,
    ].join("\n");
    const href = `mailto:${AUTHOR_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="icon-tile">
              <span className="icon-tile-inner inline-flex h-9 w-9 items-center justify-center rounded-md">
                <Mail
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
              </span>
            </div>
            <DialogTitle className="text-xl tracking-tight">
              Get in touch
            </DialogTitle>
          </div>
          <DialogDescription>
            Drop a line — feedback, bug reports, or just hello. Hitting send opens
            your mail client with everything pre-filled; you decide whether to
            actually send it.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Your name</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Your email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="So I can reply"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-reason">What&apos;s this about?</Label>
            <select
              id="contact-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <option>Feedback</option>
              <option>Bug report</option>
              <option>Feature idea</option>
              <option>Just saying hi</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              placeholder="What's on your mind?"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!message.trim()}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Send via mail
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * AuthorDialog — a "Who I am" card opened by clicking the author name in the footer.
 *
 * Hero layout: large circular avatar at the top with a soft yellow ring (mirrors the
 * doodle's frame), name + role beneath it. Bio + LinkedIn link sit below in a centered
 * column. No email line in the body — the user wanted the dialog to feel personal +
 * visual rather than a contact card.
 *
 * Avatar source: `/author-avatar.png` in `web/public/`. If the file is missing, the
 * `onError` fallback shows the initials "KN" inside the same ring so the layout
 * never breaks.
 */
interface AuthorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LINKEDIN_URL = "https://www.linkedin.in/knayan";
// Avatar lives in `web/public/` so Next serves it from the site root. Drop a different
// file there with this exact name to swap the doodle.
const AVATAR_PATH = "/KNProfPic.png";

function AuthorDialog({ open, onOpenChange }: AuthorDialogProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          {/* Avatar — circular doodle inside a soft amber ring. The ring is a static
              gradient (no animation) so the avatar stays the calm focal point. */}
          <div
            className="relative mx-auto h-28 w-28 rounded-full p-1"
            style={{
              background:
                "linear-gradient(135deg, #facc15 0%, #fbbf24 50%, #f59e0b 100%)",
            }}
          >
            <div className="h-full w-full rounded-full bg-card overflow-hidden flex items-center justify-center">
              {!avatarFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={AVATAR_PATH}
                  alt="Kumar Nayan"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <span className="text-2xl font-bold text-amber-700">KN</span>
              )}
            </div>
          </div>
          <DialogTitle className="text-2xl tracking-tight pt-3">
            Kumar Nayan
          </DialogTitle>
          <DialogDescription className="text-sm">
            React developer · Mid-level · Deloitte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed pt-2">
          <p className="text-foreground/90 text-center">
            Mid-level React developer at Deloitte by day, builder of small
            opinionated tools by night. I like clean APIs, type-safe state, and
            UIs that don&apos;t waste the user&apos;s time. SkillGauge is one of
            those side experiments — born from frustration with one-shot
            interview-prep apps that forget you the moment you log out.
          </p>
          <p className="text-muted-foreground italic text-center">
            When I&apos;m not shipping components, I&apos;m probably refactoring
            ones I shipped last week.
          </p>

          <div className="flex justify-center pt-1">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/15 text-primary font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              linkedin.in/knayan
            </a>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SectionProps {
  title: string;
  /**
   * Optional accent icon rendered inside a small gradient-bordered tile next to the
   * section heading. Adds visual rhythm so the dialog doesn't read as a wall of text.
   */
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section className="section-accent space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
        {icon && (
          <span className="icon-tile">
            <span className="icon-tile-inner inline-flex h-5 w-5 items-center justify-center">
              {icon}
            </span>
          </span>
        )}
        {title}
      </h3>
      <div className="text-foreground/90">{children}</div>
    </section>
  );
}

interface BulletProps {
  label: string;
  children: React.ReactNode;
}

function Bullet({ label, children }: BulletProps) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0"
      />
      <p>
        <strong className="font-semibold text-foreground">{label}</strong>{" "}
        <span className="text-foreground/80">{children}</span>
      </p>
    </li>
  );
}
