import { useState, useCallback } from "react";
import {
  type Session,
  type Message,
  type SessionInitRequest,
  initializeSession,
  getNextQuestion,
  submitAnswer,
  createAnswerMessage,
} from "~/services/api";

interface SessionState {
  session: Session | null;
  messages: Message[];
  isLoading: boolean;
  isComplete: boolean;
}

interface UseSessionReturn extends SessionState {
  initializeSession: (request: SessionInitRequest) => Promise<void>;
  submitUserAnswer: (answer: string) => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [state, setState] = useState<SessionState>({
    session: null,
    messages: [],
    isLoading: false,
    isComplete: false,
  });

  const initializeSessionCallback = useCallback(
    async (request: SessionInitRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const session = await initializeSession(request);
        const firstQuestion = await getNextQuestion(session.id, 0);
        setState({
          session,
          messages: [firstQuestion],
          isLoading: false,
          isComplete: false,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  const submitUserAnswer = useCallback(
    async (answer: string) => {
      if (!state.session) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const answerMsg = createAnswerMessage(answer);
        const feedback = await submitAnswer(state.session.id, answer);

        const nextIndex = state.session.currentQuestionIndex + 1;
        const isComplete = nextIndex >= state.session.totalQuestions;

        if (isComplete) {
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, answerMsg, feedback],
            isLoading: false,
            isComplete: true,
          }));
        } else {
          const nextQ = await getNextQuestion(state.session.id, nextIndex);
          setState((prev) => ({
            ...prev,
            session: prev.session
              ? { ...prev.session, currentQuestionIndex: nextIndex }
              : null,
            messages: [...prev.messages, answerMsg, feedback, nextQ],
            isLoading: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [state.session],
  );

  return {
    ...state,
    initializeSession: initializeSessionCallback,
    submitUserAnswer,
  };
}
