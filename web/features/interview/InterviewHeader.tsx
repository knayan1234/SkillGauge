"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LlmBadge } from "@/components/LlmBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { exportSessionPdf } from "@/lib/exportPdf";
import type { Message, Session } from "@/services/api";

interface InterviewHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  isActive: boolean;
  // Round number this session is on. Hidden from the header when round === 1 (single-
  // round sessions don't need the indicator); rendered as "Round N" once the user has
  // started the chained next round.
  currentRound?: number;
  // True when the user reached this view by clicking a past chatroom in the sidebar
  // (i.e., URL has `?session=<id>`). Forces the "New session" CTA to render even on
  // an active past session, so the user can always pivot to a fresh interview.
  isHistoryView?: boolean;
  // Session + messages snapshot for the "Export PDF" button. When omitted, the
  // affordance hides — useful during the loading state when the data isn't ready.
  exportableSession?: Session;
  exportableMessages?: Message[];
}

export function InterviewHeader({
  title,
  currentQuestion,
  totalQuestions,
  isActive,
  currentRound = 1,
  isHistoryView = false,
  exportableSession,
  exportableMessages,
}: InterviewHeaderProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleHome = () => {
    if (isActive) {
      setConfirmOpen(true);
    } else {
      router.push("/sessions");
    }
  };

  const confirmHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.session.active);
    setConfirmOpen(false);
    router.push("/sessions");
  };

  // Show the primary "New session" button whenever the user is in a non-active session
  // (just finished, or a completed past chatroom) OR they reached this view by clicking
  // a past chatroom from the sidebar. The history-view path covers in-progress past
  // sessions where the user wants to jump to fresh practice without abandoning anything
  // (their progress is saved server-side either way).
  const showNewSessionCta = !isActive || isHistoryView;

  // Export PDF is offered for any session with content. The CompletionCard offers it
  // too, but surfacing it in the header makes it discoverable for users who clicked a
  // past chatroom from the sidebar (where the completion card is below the fold).
  const canExportPdf =
    exportableSession !== undefined &&
    exportableMessages !== undefined &&
    exportableMessages.length > 0;
  const handleExport = () => {
    if (!exportableSession || !exportableMessages) return;
    exportSessionPdf({
      session: exportableSession,
      messages: exportableMessages,
    });
  };

  return (
    <div className="h-full flex items-center justify-between px-3 sm:px-6">
      <h1 className="text-sm font-semibold text-foreground truncate max-w-[45%] sm:max-w-[40%]">
        {title}
      </h1>
      <div className="flex items-center gap-1.5 sm:gap-3">
        {currentRound > 1 && (
          <span
            // Amber badge — round progression is an "achievement" moment (the user
            // chose to extend their practice by another round). Pairs with the brand-
            // frame halo + score amber-ring for a consistent "this is a milestone"
            // signal across the app.
            className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 text-[10px] font-semibold px-2 py-0.5"
            title="This session has chained rounds — each round ramps the difficulty."
          >
            Round {currentRound}
          </span>
        )}
        <div className="text-xs text-muted-foreground hidden md:block">
          Question {currentQuestion + 1} of {totalQuestions}
        </div>
        {canExportPdf && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleExport}
            aria-label="Export this session as PDF"
            title="Export as PDF"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Export</span>
          </Button>
        )}
        {showNewSessionCta && (
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-500/90 hover:to-amber-600/90 text-white shadow-md shadow-amber-500/25"
            onClick={() => router.push("/sessions")}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">New session</span>
          </Button>
        )}
        {/* Visible LLM provider badge so users know whether they're being graded by a
            real model or by today's deterministic stub. Hidden on the narrowest screens
            so the header toolbar doesn't overflow on mobile. */}
        <span className="hidden sm:inline-flex">
          <LlmBadge />
        </span>
        {/* Auth-aware UserMenu also lives in the interview shell so Sign out is
            reachable without leaving the interview view. */}
        <UserMenu />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleHome}
          aria-label="Back to workspace"
          title="Back to workspace"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this interview?</DialogTitle>
            <DialogDescription>
              Your progress is saved on the server. You can continue later, but
              this chat view will reset if you leave now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Stay
            </Button>
            <Button onClick={confirmHome}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
