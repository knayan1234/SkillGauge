"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  type Session,
  type Message,
  type SessionInitRequest,
  initializeSession,
  submitAnswer,
} from "@/services/api";

interface SessionState {
  session: Session | null;
  messages: Message[];
  isComplete: boolean;
}

interface UseSessionReturn extends SessionState {
  isLoading: boolean;
  initializeSession: (request: SessionInitRequest) => Promise<void>;
  submitUserAnswer: (answer: string) => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [state, setState] = useState<SessionState>({
    session: null,
    messages: [],
    isComplete: false,
  });

  // Phase 1: backend returns {session, firstQuestion} in one call — no chaining on the FE.
  const initMutation = useMutation({
    mutationFn: (request: SessionInitRequest) => initializeSession(request),
    onSuccess: ({ session, firstQuestion }) => {
      setState({
        session,
        messages: [firstQuestion],
        isComplete: false,
      });
    },
  });

  // Phase 1: backend returns {answerMsg, feedback, nextQuestion, isComplete} atomically.
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

  return {
    ...state,
    isLoading: initMutation.isPending || answerMutation.isPending,
    initializeSession: initializeSessionCallback,
    submitUserAnswer,
  };
}
