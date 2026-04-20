"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../src/app");
const connection_1 = require("../src/db/connection");
const stubClient_1 = require("../src/llm/stubClient");
async function registerAndGetCookie(app, email) {
    const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email, password: "password123" },
    });
    return res.headers["set-cookie"];
}
describe("session routes", () => {
    let app;
    let cookie;
    beforeEach(async () => {
        (0, connection_1.closeDb)();
        app = await (0, app_1.buildApp)();
        cookie = await registerAndGetCookie(app, "session-test@example.com");
    });
    afterEach(async () => {
        await app.close();
        (0, connection_1.closeDb)();
    });
    it("requires auth on all session routes", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/sessions",
            payload: {
                resumeFileName: "x.pdf",
                resumeContent: "some resume content",
                jobDescription: "x".repeat(60),
            },
        });
        expect(res.statusCode).toBe(401);
    });
    it("initializes a session and returns first question", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/sessions",
            headers: { cookie },
            payload: {
                resumeFileName: "resume.pdf",
                resumeContent: "resume text content here",
                jobDescription: "We are hiring a senior software engineer with 5+ years of experience building distributed systems",
            },
        });
        expect(res.statusCode).toBe(201);
        const body = res.json();
        expect(body.session.id).toBeDefined();
        expect(body.session.currentQuestionIndex).toBe(0);
        expect(body.session.totalQuestions).toBe(stubClient_1.STUB_TOTAL_QUESTIONS);
        expect(body.firstQuestion.type).toBe("question");
        expect(typeof body.firstQuestion.content).toBe("string");
    });
    it("runs end-to-end through all questions to completion", async () => {
        const init = await app.inject({
            method: "POST",
            url: "/api/sessions",
            headers: { cookie },
            payload: {
                resumeFileName: "r.pdf",
                resumeContent: "content",
                jobDescription: "x".repeat(60),
            },
        });
        const sessionId = init.json().session.id;
        for (let i = 0; i < stubClient_1.STUB_TOTAL_QUESTIONS; i++) {
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
            if (i === stubClient_1.STUB_TOTAL_QUESTIONS - 1) {
                expect(body.isComplete).toBe(true);
                expect(body.nextQuestion).toBeNull();
            }
            else {
                expect(body.isComplete).toBe(false);
                expect(body.nextQuestion.type).toBe("question");
            }
        }
    });
    it("rejects session access from another user with 403", async () => {
        const init = await app.inject({
            method: "POST",
            url: "/api/sessions",
            headers: { cookie },
            payload: {
                resumeFileName: "r.pdf",
                resumeContent: "content",
                jobDescription: "x".repeat(60),
            },
        });
        const sessionId = init.json().session.id;
        const otherCookie = await registerAndGetCookie(app, "stranger@example.com");
        const res = await app.inject({
            method: "GET",
            url: `/api/sessions/${sessionId}/questions/0`,
            headers: { cookie: otherCookie },
        });
        expect(res.statusCode).toBe(403);
    });
    it("rejects malformed init payload with 400", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/sessions",
            headers: { cookie },
            payload: {
                resumeFileName: "r.pdf",
                resumeContent: "content",
                jobDescription: "too short",
            },
        });
        expect(res.statusCode).toBe(400);
    });
});
//# sourceMappingURL=sessions.test.js.map