"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiError,
  type Session,
  type Message,
  type SessionInitRequest,
  initializeSession,
  submitAnswer,
  startNextRound,
  fetchSessionMessages,
  fetchSession,
  listSessions,
} from "@/services/api";

interface SessionState {
  session: Session | null;
  messages: Message[];
  isComplete: boolean;
}

interface UseSessionReturn extends SessionState {
  isLoading: boolean;
  /** True when starting a NEW session failed — lets the interview page show a retry panel
   *  instead of an endless skeleton. */
  initError: boolean;
  initializeSession: (request: SessionInitRequest) => Promise<void>;
  submitUserAnswer: (answer: string) => Promise<void>;
  startNextRound: () => Promise<void>;
  /**
   * Hydrate the hook with a past session pulled from the BE. Used when the user clicks a
   * chatroom in the sidebar — we read the session metadata from /api/sessions and replay
   * its full message transcript via /api/sessions/:id/messages. Returns an `ok` flag so
   * the caller can surface a clear error toast if the fetch fails (BE down, 404, etc.).
   */
  loadFromServer: (sessionId: string) => Promise<{ ok: boolean; error?: string }>;
}

// Turn an API failure into a user-facing toast description. SessionError-mapped responses
// (quota, input-too-large, forbidden, …) carry a useful message; the generic 500 funnel
// ("INTERNAL_ERROR" — e.g. an empty or timed-out LLM response) does not, so those get a
// friendly retry hint instead of a scary "Internal server error".
function describeError(err: unknown): string {
  if (err instanceof ApiError && err.code && err.code !== "INTERNAL_ERROR") {
    return err.message;
  }
  return "The AI is temporarily unavailable or took too long to respond. Please try again.";
}

// Resolve a session's metadata for opening a past chat. Prefer GET /api/sessions/:id
// (works for any session). If the backend doesn't have that route yet — e.g. the frontend
// deployed ahead of the backend, or vice-versa — fall back to finding it in the sessions
// list so old chats still open during a deploy lag. A genuinely missing session still
// throws (it won't be in the list either).
async function loadSessionMeta(sessionId: string): Promise<Session> {
  try {
    return await fetchSession(sessionId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const sessions = await listSessions();
      const found = sessions.find((s) => s.id === sessionId);
      if (found) return found;
    }
    throw err;
  }
}

export function useSession(): UseSessionReturn {
  const [state, setState] = useState<SessionState>({
    session: null,
    messages: [],
    isComplete: false,
  });

  // Backend returns {session, firstQuestion} in one call — no chaining on the FE.
  const initMutation = useMutation({
    mutationFn: (request: SessionInitRequest) => initializeSession(request),
    onSuccess: ({ session, firstQuestion }) => {
      setState({
        session,
        messages: [firstQuestion],
        isComplete: false,
      });
    },
    onError: (err) =>
      toast.error("Couldn't start the interview", {
        description: describeError(err),
      }),
  });

  // Backend returns {answerMsg, feedback, nextQuestion, isComplete} atomically.
  // Single setState append prevents the user seeing feedback without the next question behind it.
  const answerMutation = useMutation({
    mutationFn: async (answer: string) => {
      if (!state.session) throw new Error("No active session");
      return submitAnswer(state.session.id, answer);
    },
    onSuccess: ({ answerMsg, feedback, nextQuestion, isComplete }) => {
      setState((prev) => {
        if (!prev.session) return prev;
        const appended: Message[] = nextQuestion
          ? [...prev.messages, answerMsg, feedback, nextQuestion]
          : [...prev.messages, answerMsg, feedback];
        return {
          session: {
            ...prev.session,
            currentQuestionIndex: prev.session.currentQuestionIndex + 1,
            status: isComplete ? "completed" : "active",
          },
          messages: appended,
          isComplete,
        };
      });
    },
    onError: (err) =>
      toast.error("Couldn't grade your answer", {
        description: describeError(err),
      }),
  });

  const initializeSessionCallback = useCallback(
    async (request: SessionInitRequest) => {
      await initMutation.mutateAsync(request).catch(() => undefined);
    },
    [initMutation],
  );

  const submitUserAnswer = useCallback(
    async (answer: string) => {
      if (!state.session) return;
      await answerMutation.mutateAsync(answer).catch(() => undefined);
    },
    [answerMutation, state.session],
  );

  // Round chaining (option B). When the user clicks "Start next round" on a completed
  // session, we POST /sessions/:id/rounds/next; the BE bumps the round, extends
  // totalQuestions, returns the first question of the new round. We append it to the
  // existing transcript so the user keeps one growing chat — no remount, no scroll jump.
  const nextRoundMutation = useMutation({
    mutationFn: async () => {
      if (!state.session) throw new Error("No active session");
      return startNextRound(state.session.id);
    },
    onSuccess: ({ session, firstQuestion }) => {
      setState((prev) => ({
        // Replace the session shallowly so the new totalQuestions / currentRound flow
        // through to the header + sidebar, but preserve the full message history.
        session,
        messages: [...prev.messages, firstQuestion],
        isComplete: false,
      }));
    },
    onError: (err) =>
      toast.error("Couldn't start the next round", {
        description: describeError(err),
      }),
  });

  const startNextRoundCallback = useCallback(async () => {
    if (!state.session) return;
    await nextRoundMutation.mutateAsync().catch(() => undefined);
  }, [nextRoundMutation, state.session]);

  // Loading a past session from the BE. Two parallel calls — fetchSession for the metadata
  // (status, currentQuestionIndex, totalQuestions, resume, etc.) and fetchSessionMessages
  // for the transcript. fetchSession hits GET /api/sessions/:id (owner-checked), so it works
  // for ANY of the user's sessions — not just the recent ones the list endpoint returns, and
  // it doesn't re-pull the whole list on every chatroom click.
  //
  // onMutate clears local state immediately so navigating between chatrooms doesn't flash
  // the previous session's transcript while the new one is in flight — the page renders
  // the loading skeleton during the fetch instead.
  const loadMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const [meta, messages] = await Promise.all([
        loadSessionMeta(sessionId),
        fetchSessionMessages(sessionId),
      ]);
      return { meta, messages };
    },
    onMutate: () => {
      setState({ session: null, messages: [], isComplete: false });
    },
    onSuccess: ({ meta, messages }) => {
      setState({
        session: meta,
        messages,
        isComplete: meta.status === "completed",
      });
    },
  });

  const loadFromServer = useCallback(
    async (sessionId: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        await loadMutation.mutateAsync(sessionId);
        return { ok: true };
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to load session";
        return { ok: false, error };
      }
    },
    [loadMutation],
  );

  return {
    ...state,
    isLoading:
      initMutation.isPending ||
      answerMutation.isPending ||
      nextRoundMutation.isPending ||
      loadMutation.isPending,
    initError: initMutation.isError,
    initializeSession: initializeSessionCallback,
    submitUserAnswer,
    startNextRound: startNextRoundCallback,
    loadFromServer,
  };
}
