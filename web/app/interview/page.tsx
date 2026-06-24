"use client";

/**
 * /interview — the active interview workspace.
 *
 * Responsibilities:
 *   - Auth gate + session bootstrap from sessionStorage (set by /setup form).
 *   - Render the chat transcript via MessageBubble + the AnswerInput composer.
 *   - Coordinate the round-chaining + re-answer + completion flows by routing user
 *     interactions to the useSession hook and the dedicated CompletionCard /
 *     RetryDialog components.
 *
 * Anything heavier than orchestration lives in dedicated files:
 *   - CompletionCard         → end-of-round summary + CTAs
 *   - RetryDialog            → re-answer modal
 *   - ChatSkeleton           → first-load placeholder
 *   - interviewMessages.ts   → pure helpers (findQuestionForFeedback, sortByTimestamp)
 *
 * Why this stays a Client Component: it owns interactive state across multiple
 * children (typing indicator, scroll anchoring, retry dialog open/close, transcript
 * mutations) and uses hooks (useSession, useAuth, useRouter). Splitting any of that
 * back into a Server Component would force a network round-trip for state changes.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { InterviewLayout } from "@/components/InterviewLayout";
import { InterviewSidebar } from "@/features/interview/InterviewSidebar";
import { InterviewHeader } from "@/features/interview/InterviewHeader";
import { MessageBubble } from "@/features/interview/MessageBubble";
import { AnswerInput } from "@/features/interview/AnswerInput";
import { TypingIndicator } from "@/features/interview/TypingIndicator";
import { ChatSkeleton } from "@/features/interview/ChatSkeleton";
import { SidebarSkeleton } from "@/features/interview/SidebarSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { CompletionCard } from "@/features/interview/CompletionCard";
import { RetryDialog, type RetryTarget } from "@/features/interview/RetryDialog";
import { useSession } from "@/hooks/useSession";
import { useAuth } from "@/hooks/useAuth";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { findQuestionForFeedback, sortByTimestamp } from "@/lib/interviewMessages";
import { reanswerQuestion, type Message, type SessionOptions } from "@/services/api";

export default function InterviewPage() {
  // useSearchParams forces this page into a Suspense boundary in Next 16. The wrapper
  // keeps the existing client-only orchestration but registers the boundary correctly.
  return (
    <Suspense
      fallback={
        <InterviewLayout>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto pb-4">
              <ChatSkeleton />
            </div>
          </div>
        </InterviewLayout>
      }
    >
      <InterviewPageBody />
    </Suspense>
  );
}

function InterviewPageBody() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // When the user clicks a past chatroom we route to /interview?session=<id> and load
  // that session from the BE instead of bootstrapping a new one from sessionStorage.
  const sessionIdFromUrl = searchParams.get("session");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  // Tracks the session id we last triggered a load for. A ref (not state) because the
  // value is purely a side-effect guard inside the bootstrap effect — it doesn't drive
  // any rendered output, and refs avoid the cascading-render lint rule.
  const loadedSessionIdRef = useRef<string | null>(null);
  // Résumé filename for the sidebar's "Resume in use" card. State only when we're
  // running the new-session path (we set it before the session itself exists). For past
  // sessions loaded from the BE we derive directly from `session.resumeFileName`.
  const [bootstrapResumeFileName, setBootstrapResumeFileName] = useState<
    string | null
  >(null);
  const [retryTarget, setRetryTarget] = useState<RetryTarget | null>(null);
  // Re-answer attempts the user submits live here. The useSession hook only knows
  // about the linear flow; retries get appended to extraMessages and merged via
  // sortByTimestamp into the visible transcript.
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);

  const {
    session,
    messages,
    isLoading,
    isComplete,
    initializeSession,
    submitUserAnswer,
    startNextRound,
    loadFromServer,
  } = useSession();

  // Auth gate. While auth is resolving we render the chat skeleton (below); once
  // resolved as unauth we bounce back to home.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Two bootstrap paths, picked once per visit:
  //   A. ?session=<id> in the URL → hydrate from the BE (past session click).
  //   B. no URL param → existing flow: read résumé+JD+options from sessionStorage that
  //      the setup form put there, then POST /api/sessions to start a new session.
  useEffect(() => {
    if (!isAuthenticated) return;

    // Path A — load past session from server. Re-fires when the user clicks a different
    // chatroom (sessionIdFromUrl changes without unmounting). On failure (BE down / 404)
    // we toast an explicit error and bounce back to the workspace so the user isn't stuck
    // on an indefinite loading skeleton.
    if (sessionIdFromUrl && sessionIdFromUrl !== loadedSessionIdRef.current) {
      loadedSessionIdRef.current = sessionIdFromUrl;
      setExtraMessages([]);
      void loadFromServer(sessionIdFromUrl).then((result) => {
        if (result.ok) {
          setInitialized(true);
        } else {
          toast.error("Couldn't load session", {
            description:
              result.error ??
              "The backend may be unreachable. Try again from the workspace.",
          });
          router.push("/sessions");
        }
      });
      return;
    }

    // Path B — fresh session from sessionStorage. Only runs once.
    if (initialized || sessionIdFromUrl) return;

    const resumePayload = sessionStorage.getItem(STORAGE_KEYS.session.id);
    const jobDescription = sessionStorage.getItem(
      STORAGE_KEYS.session.jobDescription,
    );
    const optionsRaw = sessionStorage.getItem(STORAGE_KEYS.session.options);

    if (!resumePayload || !jobDescription || !optionsRaw) {
      router.push("/setup");
      return;
    }

    let parsed: {
      resumeFileName: string;
      resumeContent: string;
      resumeMime?: string;
    };
    let options: SessionOptions;
    try {
      parsed = JSON.parse(resumePayload);
      options = JSON.parse(optionsRaw) as SessionOptions;
    } catch {
      router.push("/setup");
      return;
    }

    // One-shot bootstrap state — paired with initializeSession on the same tick. This
    // isn't a derived-state mirror (the lint rule's main concern); it's the page's
    // initial setup, which fundamentally requires a setState. Disabling the rule here
    // is intentional and scoped to this single line.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBootstrapResumeFileName(parsed.resumeFileName);
    initializeSession({
      resumeFileName: parsed.resumeFileName,
      resumeContent: parsed.resumeContent,
      // Defensive default for archived/legacy entries that pre-date the resumeMime
      // field. The BE falls back to UTF-8 decode on unknown MIMEs.
      resumeMime: parsed.resumeMime ?? "application/octet-stream",
      jobDescription,
      ...options,
    });

    setInitialized(true);
  }, [
    initialized,
    isAuthenticated,
    router,
    initializeSession,
    sessionIdFromUrl,
    loadFromServer,
  ]);

  // Résumé filename shown by the sidebar's "Resume in use" card. For past-session loads
  // we derive directly from the BE's session doc; for new sessions we use the value the
  // bootstrap effect lifted out of sessionStorage. Derived rather than mirrored to keep
  // data flow one-way.
  const resumeFileName = sessionIdFromUrl
    ? (session?.resumeFileName ?? null)
    : bootstrapResumeFileName;

  // Combine the hook's linear transcript with any re-answer attempts. createdAt-ASC
  // sort keeps the timeline monotonic regardless of insertion order.
  const allMessages = useMemo(
    () => sortByTimestamp([...messages, ...extraMessages]),
    [messages, extraMessages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Clear the "in progress" marker once the backend says we're done — lets /setup
  // skip the archive-confirm modal on the next run.
  useEffect(() => {
    if (isComplete) {
      sessionStorage.removeItem(STORAGE_KEYS.session.active);
    }
  }, [isComplete]);

  if (authLoading || !session) {
    return (
      <InterviewLayout
        sidebar={<SidebarSkeleton />}
        header={
          <div
            className="h-full flex items-center justify-between px-6"
            role="status"
            aria-busy="true"
            aria-label="Loading session"
          >
            <Skeleton className="h-3 w-40" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        }
      >
        {/* Skeleton mirrors the real chat rhythm so the layout doesn't shift when the
            first question lands. Sidebar + header skeletons above keep the page shape
            stable so content drops into the right slots. */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto pb-4">
            <ChatSkeleton />
          </div>
        </div>
      </InterviewLayout>
    );
  }

  const handleStartNewSession = () => {
    sessionStorage.removeItem(STORAGE_KEYS.session.id);
    sessionStorage.removeItem(STORAGE_KEYS.session.jobDescription);
    sessionStorage.removeItem(STORAGE_KEYS.session.options);
    sessionStorage.removeItem(STORAGE_KEYS.session.active);
    router.push("/setup");
  };

  // Open the retry modal for a specific feedback bubble. The lookup walks the
  // visible transcript to find the question that produced this feedback.
  const openRetryFor = (feedback: Message) => {
    const q = findQuestionForFeedback(allMessages, feedback);
    if (!q) return;
    setRetryTarget({ questionIndex: q.index, questionContent: q.content });
  };

  // The RetryDialog hands us the user's attempt; we forward to the BE and on
  // success append the new answer + feedback rows to the visible transcript.
  const submitRetry = async (questionIndex: number, answer: string) => {
    try {
      const result = await reanswerQuestion(session.id, questionIndex, answer);
      setExtraMessages((prev) => [...prev, result.answerMsg, result.feedback]);
      toast.success("Re-graded", {
        description: "Your retry is at the bottom of the transcript.",
      });
    } catch (err) {
      toast.error("Re-grade failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      throw err; // RetryDialog stays open on rejection
    }
  };

  // Tag pills for question bubbles. Derived from session options — no LLM contract
  // change. The session title carries the style label; we surface that as a pill.
  const styleTag = session.title.split(" ")[1]?.toLowerCase() ?? null;
  const questionTags: string[] = styleTag ? [styleTag] : [];

  return (
    <InterviewLayout
      sidebar={
        <InterviewSidebar
          sessionTitle={session.title}
          resumeFileName={resumeFileName}
          // BE returns the parsed plain text on session init. We display it in the
          // "View résumé" dialog so users see what the LLM is grading against.
          resumeContent={session.resumeContent ?? null}
          isActive={!isComplete}
        />
      }
      header={
        <InterviewHeader
          title={session.title}
          currentQuestion={session.currentQuestionIndex}
          totalQuestions={session.totalQuestions}
          isActive={!isComplete}
          // Treat history-loaded views as "show the New session CTA" regardless of
          // whether the backing session is still active — once the user is browsing
          // an old chatroom, jumping to a fresh session needs to be one click away.
          isHistoryView={Boolean(sessionIdFromUrl)}
          currentRound={session.currentRound ?? 1}
          exportableSession={session}
          exportableMessages={allMessages}
        />
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {allMessages.map((message) => {
              const onRetry =
                message.type === "feedback"
                  ? () => openRetryFor(message)
                  : undefined;
              return (
                <MessageBubble
                  key={message.id}
                  type={message.type as "question" | "answer" | "feedback"}
                  content={message.content}
                  feedback={message.feedback}
                  tags={message.type === "question" ? questionTags : undefined}
                  onRetry={onRetry}
                />
              );
            })}

            {isLoading && <TypingIndicator />}

            {isComplete && (
              <CompletionCard
                session={session}
                messages={allMessages}
                currentRound={session.currentRound ?? 1}
                onStartNew={handleStartNewSession}
                onStartNextRound={startNextRound}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <AnswerInput
          onSubmit={submitUserAnswer}
          isLoading={isLoading}
          isDisabled={isComplete}
        />
      </div>

      <RetryDialog
        target={retryTarget}
        onClose={() => setRetryTarget(null)}
        onSubmit={submitRetry}
      />
    </InterviewLayout>
  );
}
