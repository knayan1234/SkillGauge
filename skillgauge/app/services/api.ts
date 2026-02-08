// Mock API for SkillGauge - Placeholders for production implementation
// TODO: Replace with actual backend API endpoints
// TODO: Integrate Vector DB (Pinecone/Weaviate) for resume embeddings
// TODO: Connect LLM API (OpenAI/Anthropic) for intelligent questioning

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Session {
  id: string;
  title: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: "active" | "completed";
  createdAt: string;
}

export interface Message {
  id: string;
  type: "question" | "answer" | "feedback";
  content: string;
  timestamp: string;
  feedback?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
}

export interface SessionInitRequest {
  resumeFileName: string;
  resumeContent: string;
  jobDescription: string;
}

// Local storage helpers
const TOKEN_KEY = "skillgauge_token";
const USER_KEY = "skillgauge_user";

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

// Mock questions
const QUESTIONS = [
  "Tell me about yourself and your background.",
  "Why are you interested in this position?",
  "What's your greatest professional achievement?",
  "Describe a challenge you overcame at work.",
  "Where do you see yourself in 5 years?",
];

// Auth functions
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    user: {
      id: "demo_user",
      email,
      name: email.split("@")[0],
    },
    token: "demo_token_" + Date.now(),
  };
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return loginUser(email, password);
}

// Session functions
export async function initializeSession(
  request: SessionInitRequest,
): Promise<Session> {
  // TODO: In production:
  // 1. Parse and vectorize resume using embeddings model
  // 2. Store resume vectors in Vector DB (Pinecone/Weaviate)
  // 3. Vectorize job description
  // 4. Use LLM to generate personalized questions based on resume + job desc
  // 5. Store session in database with user_id

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: "session_" + Date.now(),
    title: "Interview Practice",
    currentQuestionIndex: 0,
    totalQuestions: 5,
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

export async function getNextQuestion(
  sessionId: string,
  questionIndex: number,
): Promise<Message> {
  // TODO: In production:
  // 1. Retrieve session context from database
  // 2. Get relevant resume sections from Vector DB using semantic search
  // 3. Call LLM API to generate contextual question
  // 4. Consider previous Q&A history for follow-up questions

  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    id: "msg_" + Date.now(),
    type: "question",
    content: QUESTIONS[questionIndex] || QUESTIONS[0],
    timestamp: new Date().toISOString(),
  };
}

export async function submitAnswer(
  sessionId: string,
  answer: string,
): Promise<Message> {
  // TODO: In production:
  // 1. Vectorize the answer using embeddings
  // 2. Compare with job requirements using Vector DB similarity search
  // 3. Use LLM to analyze answer quality, relevance, and structure
  // 4. Generate personalized feedback with actionable improvements
  // 5. Calculate score based on multiple factors (relevance, clarity, depth)

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const score = Math.min(10, Math.max(6, Math.floor(answer.length / 15)));

  return {
    id: "msg_" + Date.now(),
    type: "feedback",
    content: `Great answer! Score: ${score}/10`,
    timestamp: new Date().toISOString(),
    feedback: {
      score,
      strengths: ["Clear communication", "Good structure", "Relevant details"],
      improvements: [
        "Add more specific examples",
        "Include measurable results",
      ],
    },
  };
}

export function createAnswerMessage(answer: string): Message {
  return {
    id: "msg_" + Date.now(),
    type: "answer",
    content: answer,
    timestamp: new Date().toISOString(),
  };
}
