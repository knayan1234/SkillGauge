import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryWrapper } from "@/test/queryWrapper";
import type { AnswerResult, Message, Session } from "@/services/api";

// Mock the api module so tests assert the hook's state machine, not the network.
// Each test arranges the next init/submit response explicitly — matches the HTTP contract.
jest.mock("@/services/api", () => {
  const actual = jest.requireActual("@/services/api") as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    initializeSession: jest.fn(),
    submitAnswer: jest.fn(),
  };
});

import { useSession } from "./useSession";
import { initializeSession, submitAnswer } from "@/services/api";

const mockInit = initializeSession as jest.MockedFunction<
  typeof initializeSession
>;
const mockSubmit = submitAnswer as jest.MockedFunction<typeof submitAnswer>;

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    title: "Interview Practice",
    currentQuestionIndex: 0,
    totalQuestions: 2,
    status: "active",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
function makeMessage(
  type: Message["type"],
  content: string,
  feedback?: Message["feedback"],
): Message {
  return {
    id: `m_${Math.random()}`,
    type,
    content,
    timestamp: new Date().toISOString(),
    feedback,
  };
}

const buildRequest = () => ({
  resumeFileName: "resume.pdf",
  resumeContent: "sample content",
  jobDescription: "We are hiring a senior engineer with lots of experience",
  interviewStyle: "mixed" as const,
  difficulty: "medium" as const,
  roleLevel: "mid" as const,
  questionCount: 5,
});

describe("useSession", () => {
  beforeEach(() => {
    mockInit.mockReset();
    mockSubmit.mockReset();
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: QueryWrapper,
    });
    expect(result.current.session).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("initializes a session and loads the first question", async () => {
    mockInit.mockResolvedValue({
      session: makeSession(),
      firstQuestion: makeMessage("question", "Q1"),
    });

    const { result } = renderHook(() => useSession(), {
      wrapper: QueryWrapper,
    });

    await act(async () => {
      await result.current.initializeSession(buildRequest());
    });

    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].type).toBe("question");
  });

  it("appends answer + feedback + next question after submit", async () => {
    mockInit.mockResolvedValue({
      session: makeSession(),
      firstQuestion: makeMessage("question", "Q1"),
    });
    mockSubmit.mockResolvedValue({
      answerMsg: makeMessage("answer", "my answer"),
      feedback: makeMessage("feedback", "Great answer! Score: 8/10", {
        score: 8,
        strengths: ["a"],
        improvements: ["b"],
      }),
      nextQuestion: makeMessage("question", "Q2"),
      isComplete: false,
    } satisfies AnswerResult);

    const { result } = renderHook(() => useSession(), {
      wrapper: QueryWrapper,
    });
    await act(async () => {
      await result.current.initializeSession(buildRequest());
    });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    await act(async () => {
      await result.current.submitUserAnswer("my answer");
    });

    await waitFor(() => expect(result.current.messages.length).toBe(4));
    const types = result.current.messages.map((m) => m.type);
    expect(types).toEqual(["question", "answer", "feedback", "question"]);
  });

  it("marks complete when backend says so", async () => {
    mockInit.mockResolvedValue({
      session: makeSession({ totalQuestions: 1 }),
      firstQuestion: makeMessage("question", "Q1"),
    });
    mockSubmit.mockResolvedValue({
      answerMsg: makeMessage("answer", "last answer"),
      feedback: makeMessage("feedback", "Great answer!", {
        score: 9,
        strengths: [],
        improvements: [],
      }),
      nextQuestion: null,
      isComplete: true,
    });

    const { result } = renderHook(() => useSession(), {
      wrapper: QueryWrapper,
    });
    await act(async () => {
      await result.current.initializeSession(buildRequest());
    });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    await act(async () => {
      await result.current.submitUserAnswer("last answer");
    });

    await waitFor(() => expect(result.current.isComplete).toBe(true));
    expect(result.current.session?.status).toBe("completed");
  });
});
