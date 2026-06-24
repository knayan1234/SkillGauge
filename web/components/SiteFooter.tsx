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
import { toast } from "sonner";

const BUILD_YEAR = new Date().getFullYear();
const AUTHOR_EMAIL = "kunayan.dev@gmail.com";
// Web3Forms access key — free form-to-email service. Create it at https://web3forms.com
// using AUTHOR_EMAIL; submissions only deliver to that registered address, so this key
// is safe to ship in the client bundle. Set it in Netlify as NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY.
// When unset, the contact form falls back to a mailto: link.
const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "";

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
                className="text-foreground font-medium underline decoration-amber-500/50 underline-offset-2 hover:text-amber-700 dark:hover:text-amber-400 hover:decoration-amber-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
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
        <DialogContent className="max-w-2xl">
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

          <div className="space-y-5 text-sm leading-relaxed pt-2">
            <Section title="What it is" icon={<FileText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              A personal interview-practice tool. Add your résumé and a job
              description, and an AI interviewer asks you questions one at a
              time, scores each answer 1–10, and tells you what to improve.
            </Section>

            <Section title="What makes it useful" icon={<Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              <ul className="space-y-2 pl-1">
                <Bullet label="Built around you.">
                  Questions come from your résumé and the target role — not a
                  generic bank.
                </Bullet>
                <Bullet label="Useful feedback.">
                  Every answer gets a score and a clear &ldquo;what to fix next
                  time.&rdquo;
                </Bullet>
                <Bullet label="It remembers.">
                  Your weak spots come back in later rounds, at higher
                  difficulty, until you&apos;ve got them.
                </Bullet>
                <Bullet label="Everything is saved.">
                  Past sessions stay, organized by résumé and date — retry any
                  answer anytime.
                </Bullet>
              </ul>
            </Section>

            <Section title="Privacy" icon={<ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              Your résumé, job descriptions, and answers are stored only to give
              you that continuity. Nothing is shared or sold — no ads, no
              tracking.
            </Section>

            <Section title="Made by" icon={<User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
              Kumar Nayan (
              <a
                href="mailto:kumarnayan.work@gmail.com"
                className="text-primary hover:underline underline-offset-2"
              >
                kumarnayan.work@gmail.com
              </a>
              ) — a personal project, built end-to-end by one person.
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
 * ContactDialog — reach-out form. Submits to Web3Forms (free, no backend), which emails
 * the message to the address the access key is registered to (AUTHOR_EMAIL). The key
 * (NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY) is safe to ship client-side — Web3Forms only
 * delivers to that pre-registered address. If the key is unset, falls back to mailto:.
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
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setReason("Feedback");
    setMessage("");
  };

  // Send via Web3Forms (free, no backend) — it emails the submission to the address the
  // access key is registered to. If no key is configured, fall back to opening the
  // user's mail client with everything pre-filled.
  const handleSend = async () => {
    const subject = `[SkillGauge] ${reason} from ${name || "a visitor"}`;

    if (!WEB3FORMS_ACCESS_KEY) {
      const body = [
        `From: ${name || "(unnamed)"}${email ? ` <${email}>` : ""}`,
        `Reason: ${reason}`,
        "",
        message,
      ].join("\n");
      window.location.href = `mailto:${AUTHOR_EMAIL}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
      onOpenChange(false);
      reset();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject,
          from_name: name || "SkillGauge visitor",
          name: name || "(unnamed)",
          email: email || AUTHOR_EMAIL,
          reason,
          message,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Something went wrong sending your message.");
      }
      toast.success("Message sent", {
        description: "Thanks for reaching out — I'll get back to you.",
      });
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error("Couldn't send your message", {
        description:
          err instanceof Error
            ? err.message
            : `Please try again, or email ${AUTHOR_EMAIL} directly.`,
      });
    } finally {
      setSubmitting(false);
    }
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
            Drop a line — feedback, bug reports, or just hello. Your message
            comes straight to my inbox.
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
            <Button type="submit" disabled={!message.trim() || submitting}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              {submitting ? "Sending…" : "Send message"}
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
            React developer at Deloitte. I build small side projects in my spare
            time. SkillGauge is one of them — an interview-prep tool that
            remembers your past sessions and builds on them, instead of starting
            from scratch every visit.
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
