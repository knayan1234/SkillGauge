# SkillGauge

AI-powered interview-prep platform. Upload a résumé + job description, pick a style/difficulty/persona, and an AI interviewer asks questions one at a time — scoring each answer 1–10 with strengths and improvements. Sessions are saved, questions never repeat per résumé, difficulty ramps across rounds, and progress is tracked on a dashboard.

---

## What it does

- Upload a résumé (PDF / DOCX / text) + paste a target job description
- AI interviewer asks context-aware questions one at a time (behavioral / technical / mixed; persona-flavored)
- Each answer scored 1–10 with strengths + improvements (rubric grading)
- Round chaining (difficulty ramps, weak areas carried forward); re-answer any question
- Per-résumé question bank with a **no-repeat** guarantee
- Dashboard: score trend, weak areas, practice mix; client-side PDF export; voice (mic) + text-to-speech
- Long-term memory via vector embeddings (Atlas Vector Search)

## Tech stack

**Frontend** ([web/](web/)) — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, @tanstack/react-query, react-hook-form + zod, next-themes, recharts, framer-motion, jsPDF. Jest + React Testing Library.

**Backend** ([backend/](backend/)) — Express 5 + TypeScript, MongoDB (official driver), httpOnly-cookie JWT auth (bcryptjs, per-IP rate limit + per-email lockout + JWT epoch rotation), pino logging, daily-token + input-size cost guards.

**AI** — provider-agnostic `LLMClient` with four implementations: **stub** (default, no key, works offline) / OpenAI / Anthropic / **Gemini** (recommended free tier). Embeddings via `EmbeddingsClient` (stub / Gemini) → `memories` collection → Atlas `$vectorSearch`.

**Same-origin BFF** — the browser only ever calls `/api/*`; a Next.js route handler ([web/app/api/[...path]/route.ts](web/app/api/%5B...path%5D/route.ts)) proxies to the Express backend (`BACKEND_URL` is server-only).

## Running locally (two terminals)

**Backend:**

```bash
cd backend
cp .env.example .env     # set JWT_SECRET + MONGODB_URI; for a real LLM also set
                         #   LLM_PROVIDER=gemini  GEMINI_API_KEY=...  GEMINI_MODEL=gemini-2.5-flash
npm install
npm run migrate          # idempotent: creates indexes
npm run dev              # http://127.0.0.1:4000
```

**Frontend:**

```bash
cd web
cp .env.local.example .env.local   # BACKEND_URL=http://localhost:4000
npm install
npm run dev              # http://localhost:3000
npm test                 # Jest (39 tests)
npm run build
```

The app defaults to the deterministic **stub** LLM (no API key, fully functional). To use a real model, set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY` in `backend/.env` and pick **`gemini-2.5-flash`**

## Status

Feature-complete for the personal-use scope. Real LLM (Gemini) wired & verified end-to-end; fully mobile-responsive.
