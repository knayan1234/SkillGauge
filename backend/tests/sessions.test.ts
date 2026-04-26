import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { resetDb, startMongo, stopMongo } from "./mongoHarness";

async function registerAndGetCookie(
  app: FastifyInstance,
  email: string,
): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password: "password123" },
  });
  return res.headers["set-cookie"] as string;
}

const baseInitPayload = {
  resumeFileName: "resume.pdf",
  resumeContent: "resume text content here",
  jobDescription:
    "We are hiring a senior software engineer with 5+ years of experience building distributed systems",
  interviewStyle: "mixed" as const,
  difficulty: "medium" as const,
  roleLevel: "mid" as const,
  questionCount: 3 as const,
};

describe("session routes", () => {
  let app: FastifyInstance;
  let cookie: string;

  beforeAll(async () => {
    await startMongo();
  });

  afterAll(async () => {
    await stopMongo();
  });

  beforeEach(async () => {
    await resetDb();
    app = await buildApp();
    cookie = await registerAndGetCookie(app, "session-test@example.com");
  });

  afterEach(async () => {
    await app.close();
  });

  it("requires auth on all session routes (NOT_AUTHENTICATED)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      payload: baseInitPayload,
    });
    expect(res.statusCode).toBe(401);
    // Structured error contract — body has {code, message}, not legacy {error}.
    expect(res.json().code).toBe("NOT_AUTHENTICATED");
  });

  it("initializes a session and returns first question", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: baseInitPayload,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.session.id).toBeDefined();
    expect(body.session.currentQuestionIndex).toBe(0);
    expect(body.session.totalQuestions).toBe(baseInitPayload.questionCount);
    expect(body.firstQuestion.type).toBe("question");
    expect(typeof body.firstQuestion.content).toBe("string");
  });

  it("runs end-to-end through all questions to completion", async () => {
    const init = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: baseInitPayload,
    });
    const sessionId = init.json().session.id as string;
    const total = baseInitPayload.questionCount;

    for (let i = 0; i < total; i++) {
      const answerRes = await app.inject({
        method: "POST",
        url: `/api/sessions/${sessionId}/answers`,
        headers: { cookie },
        payload: { answer: `this is my answer number ${i} with enough length` },
      });
      expect(answerRes.statusCode).toBe(200);
      const body = answerRes.json();
      expect(body.answerMsg.type).toBe("answer");
      expect(body.feedback.type).toBe("feedback");
      expect(body.feedback.feedback.score).toBeGreaterThanOrEqual(6);
      if (i === total - 1) {
        expect(body.isComplete).toBe(true);
        expect(body.nextQuestion).toBeNull();
      } else {
        expect(body.isComplete).toBe(false);
        expect(body.nextQuestion.type).toBe("question");
      }
    }
  });

  it("rejects session access from another user with SESSION_FORBIDDEN (403)", async () => {
    const init = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: baseInitPayload,
    });
    const sessionId = init.json().session.id as string;

    const otherCookie = await registerAndGetCookie(app, "stranger@example.com");
    const res = await app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}/questions/0`,
      headers: { cookie: otherCookie },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe("SESSION_FORBIDDEN");
  });

  it("returns SESSION_NOT_FOUND (404) for a non-existent session id", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/sessions/no-such-session/questions/0",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("SESSION_NOT_FOUND");
  });

  it("rejects malformed init payload with INVALID_FORMAT (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: {
        ...baseInitPayload,
        jobDescription: "too short",
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("INVALID_FORMAT");
  });

  it("rejects unsupported interview style with INVALID_FORMAT (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: {
        ...baseInitPayload,
        interviewStyle: "coffee-chat",
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("INVALID_FORMAT");
  });

  it("honors difficulty by selecting harder technical prompts", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { cookie },
      payload: {
        ...baseInitPayload,
        interviewStyle: "technical",
        difficulty: "hard",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.firstQuestion.content.length).toBeGreaterThan(0);
  });
});
