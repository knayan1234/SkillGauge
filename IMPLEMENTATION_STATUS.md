# SkillGauge Implementation Status

**Current phase:** Phase 1.1 — UX Enhancements **(COMPLETE ✓)**
**Last updated:** 2026-04-20

## Purpose

This document separates:

- what is already built
- what is partially built
- what still needs to be built
- how the project is currently organized
- how it is expected to evolve through the remaining phases

For the architectural reference see [ARCHITECTURE.md](ARCHITECTURE.md). For the changelog see [PROGRESS.md](PROGRESS.md).

---

## Current Repo Reality

- Frontend in [web/](web/) — Next.js 16 App Router, statically optimized pages, real HTTP to the backend; dark-mode via `next-themes` with a system-aware toggle.
- Backend in [backend/](backend/) — Fastify 5 + TypeScript, MongoDB persistence (official `mongodb` driver), httpOnly cookie JWT auth.
- AI layer is a **deterministic stub** (`stubClient`) behind the `LLMClient` interface — now routes by interview style + difficulty + role level with per-style question banks; swappable to OpenAI / Anthropic / Ollama in Phase 2 without touching service code.
- Session setup collects richer inputs: interview style, difficulty, role level, question count (3/5/7/10), optional focus areas — all persisted in the session doc and passed into `QuestionContext`.
- Resume-change guard: starting a new interview while one is active prompts to archive the prior snapshot (localStorage) before overwriting the live session handoff blob.
- The old `skillgauge/` RR7 prototype has been deleted (Phase 0b).
- CI runs two parallel jobs (`web`, `backend`) — each install → typecheck → test → build.
- 23 FE tests + 13 BE tests = 36 total, green.

---

## Current Project Folder Structure

```text
SkillGauge/
|-- .github/workflows/ci.yml     # parallel web + backend jobs
|-- ARCHITECTURE.md              # architecture reference
|-- PROGRESS.md                  # phase log + changelog
|-- IMPLEMENTATION_STATUS.md     # this file
|-- README.md
|-- LICENSE
|-- audits/
|   `-- code-duplication-audit-2026-04-19.md
|-- backend/                     # Fastify 5 API (Phase 1)
|   |-- src/
|   |   |-- config/env.ts        # zod-validated env
|   |   |-- db/                  # connection + indexes + repos (Mongo)
|   |   |-- llm/                 # LLMClient interface + stubClient
|   |   |-- plugins/auth.ts      # JWT cookie + requireAuth
|   |   |-- modules/
|   |   |   |-- auth/            # register/login/logout/me
|   |   |   |-- sessions/        # init + questions + answers
|   |   |   `-- health/
|   |   |-- shared/types.ts
|   |   |-- app.ts               # buildApp() factory
|   |   `-- index.ts             # bootstrap
|   |-- tests/                   # auth + sessions + mongoHarness (mongodb-memory-server)
|   |-- .env.example
|   |-- jest.config.ts
|   |-- package.json
|   `-- tsconfig.json
`-- web/                         # Next.js 16 App Router FE
    |-- app/                     # pages + layout + providers + error/not-found
    |-- components/              # AppLayout + InterviewLayout + ThemeToggle + shadcn ui/
    |-- features/                # auth / session-setup (rich options) / interview (sidebar resume card)
    |-- hooks/                   # useAuth, useSession (+ tests)
    |-- lib/                     # queryClient, storageKeys (session/archived/active/theme), utils
    |-- services/api.ts          # real HTTP client — SessionInitRequest extends SessionOptions
    |-- test/queryWrapper.tsx
    |-- .env.local.example
    |-- jest.config.ts + jest.setup.ts
    |-- next.config.ts + tsconfig.json
    `-- package.json
```

---

## What Is Already Built

### Frontend (Phase 0a → 0b → 1 → 1.1, all done)

| Area | Status | Notes |
|---|---|---|
| App shell + routing | ✓ done | Next 16 App Router, `/`, `/setup`, `/interview`, `not-found`, `error` |
| Landing / setup / interview UI | ✓ done | Branded, responsive, transcript + typing indicator |
| Dark mode | ✓ done (1.1) | `next-themes` `ThemeProvider attribute="class"`, hydration-safe `ThemeToggle` in both layout headers, Tailwind 4 `@custom-variant dark` + palette overrides |
| Auth UI | ✓ done | `AuthModal` with RHF + zod, login/register toggles, prefilled demo creds |
| Session setup UI | ✓ done (1.1) | Resume + JD plus interview style, difficulty, role level, question count (3/5/7/10), optional focus areas; zod schema uses `enum → transform(Number)` to keep RHF input-type clean |
| Interview chat UI | ✓ done | Question / answer / feedback bubbles, completion card |
| Interview header + sidebar | ✓ done (1.1) | Brand-as-home-button with confirm dialog when session active; resume card (filename + View dialog showing `resumeContent`); `ThemeToggle` rightmost; `isActive` flips off on completion |
| Resume-swap archive guard | ✓ done (1.1) | Starting new session while prior is active opens a Radix Dialog; "Archive and start new" pushes prior `{resume, jobDescription, options}` snapshot into `localStorage[archived_sessions]` before overwriting sessionStorage |
| Real API integration | ✓ done | `services/api.ts` hits backend over `fetch` with `credentials: "include"`; `SessionInitRequest` now extends `SessionOptions` |
| Real auth flow | ✓ done | `useQuery({ queryFn: fetchMe })` on `/api/me`; cookie is the session; `queryClient.clear()` on logout |
| Form validation | ✓ done | zod schemas shared in shape with BE |
| Session bootstrap | ✓ done (1.1) | Setup form → `FileReader` → sessionStorage (`current_session` + `job_description` + `session_options` + `session_in_progress`) → `/interview` page → `initializeSession(...options)` |
| Testing | ✓ done (1.1) | 23 Jest tests across 5 files; schema tests cover new enum fields; hook tests pass all 4 options into `buildRequest()` |
| Build + CI | ✓ done | `tsc --noEmit`, `jest --ci`, `next build` all green in CI |

### Backend (Phase 1 → 1.1, done)

| Area | Status | Notes |
|---|---|---|
| Service scaffold | ✓ done | [backend/](backend/) — Fastify 5 + TS (CommonJS), tsx dev, Jest + ts-jest |
| Env config | ✓ done | zod-validated, dev fallback for `JWT_SECRET`, fatal in prod |
| HTTP server | ✓ done | `buildApp()` factory separate from `listen()` for `app.inject()` tests |
| CORS + cookies | ✓ done | `@fastify/cors` with explicit origin + credentials; `@fastify/cookie` |
| Auth (register/login/logout/me) | ✓ done | bcryptjs (10 rounds), JWT HS256 7-day, httpOnly cookie `skillgauge_session` |
| `requireAuth` preHandler | ✓ done | Verifies cookie, loads user onto `request.user`; 401 on missing/tampered |
| Session lifecycle | ✓ done (1.1) | Create session + first question atomically; `totalQuestions` driven by `request.questionCount`; idempotent question fetch; batched answer response |
| Session init contract | ✓ done (1.1) | `initSessionSchema` now accepts `interviewStyle` + `difficulty` + `roleLevel` + `questionCount` + optional `focusAreas`; persisted on the session doc and threaded into `QuestionContext` via `ctxFromSession()` |
| Ownership enforcement | ✓ done | Centralized in `loadOwnedSession(userId, sessionId)` — 403 on mismatch |
| MongoDB persistence | ✓ done | Official `mongodb` driver; `MongoClient` singleton; `ensureIndexes()` idempotent + invoked on boot and via `npm run migrate` |
| DB schema | ✓ done (1.1) | Collections `users`, `sessions` (+ new options fields), `messages` with UUID string `_id`; partial-unique `{sessionId, questionIndex}` for idempotent question slots |
| LLMClient abstraction | ✓ done (1.1) | Interface extended with the 4 options on `QuestionContext`; `stubClient` picks from `BEHAVIORAL_QUESTIONS` / `TECHNICAL_QUESTIONS_BY_DIFFICULTY` / interleaved `mixed` bank, appends role suffix, and scales the length-proxy score divisor (10 / 15 / 25 for easy / medium / hard) |
| Testing | ✓ done (1.1) | 13 tests, per-suite `mongodb-memory-server`, Fastify `app.inject()` — added 400 on invalid interviewStyle + difficulty-hard technical pick |
| Build + CI | ✓ done | Parallel CI job running install → typecheck → test → build |

### External services currently required

**MongoDB only.** Point `MONGODB_URI` at either a local Mongo (`docker run -d -p 27017:27017 mongo:7`) or an Atlas M0 free-tier cluster — no API keys. `stubClient` runs in-process. Tests are fully self-contained via `mongodb-memory-server`.

---

## What Is Partial

| Area | Why it's partial | Where it lands |
|---|---|---|
| Resume ingestion | We store the text (`resumeContent`) read via `FileReader`. No PDF/DOC parsing yet — the text is passed straight through. | Phase 2 (parser) or Phase 4 (object storage for the original file) |
| AI behavior | Real interface, stubbed implementation — questions are from a canned array, scoring is a length proxy. | Phase 2 |
| Session history sidebar | Phase 1.1 shrank the list to the active session only (no more placeholder clutter) and surfaces the current resume; full history still blocked on `GET /api/sessions`. | Phase 3 |
| Archive store | `localStorage[archived_sessions]` keeps a local snapshot of prior sessions so mid-interview swaps don't silently lose context — it's not a real history list, just a safety net until Phase 3 ships the list endpoint. | Phase 3 |
| Error messaging | Backend returns structured errors; FE surfaces them only at form level. Global toast/banner not yet wired. | Phase 4 |
| Accessibility | Basic semantic HTML and Radix primitives — no dedicated a11y audit. | Phase 4 |

---

## What Still Needs to Be Built

### Phase 2 — AI Intelligence (next)

| Area | Priority | What |
|---|---|---|
| Real LLM provider | High | Implement `openaiClient` and/or `anthropicClient` against the existing `LLMClient` interface |
| Prompt management | High | Versioned prompts for question generation and rubric-based grading |
| Resume + JD parsing | High | Extract text from PDF/DOC/DOCX server-side; chunk and normalize |
| Rate limiting + cost guardrails | Medium | Per-user quotas; abort on abusive input length |
| Prompt regression tests | Medium | Golden-answer fixtures; snapshot LLM output shape |

### Phase 3 — Long-term Memory + Dashboard

| Area | Priority | What |
|---|---|---|
| Vector DB | High | Mongo Atlas Vector Search / Pinecone — embed past answers + resume chunks for cross-session context |
| Embeddings provider | High | OpenAI `text-embedding-3-small` or Voyage behind an interface analogous to `LLMClient` |
| Managed Mongo | High | Move dev Mongo → managed Atlas; tune connection pool + replica-set config |
| `GET /api/sessions` list | High | Populate sidebar history with real sessions |
| Progress dashboard | High | Aggregate scores, strengths, weaknesses across sessions — new `/dashboard` route |
| Weakness summaries | Medium | Derived data cached and refreshed after each session |

### Phase 4 — Production Readiness

| Area | Priority | What |
|---|---|---|
| E2E tests | High | Playwright across register → setup → interview → complete |
| Observability | High | Pino log ship + Sentry error tracker |
| Security headers + rate limits | High | Helmet-equivalent for Fastify, per-route rate limits |
| Object storage | Medium | S3 / R2 for resume files (today `resumeContent` lives in Mongo) |
| CI hardening | Medium | Separate workflow for dependency updates; semver enforcement |
| Deploy config | Medium | Fly.io / Railway for BE, Vercel for FE, prod env templates |
| A11y pass | Medium | axe-core run, focus management, aria audits |

---

## Recommended Full Project Folder Structure (target)

The current layout already matches this target — `web/` and `backend/` side by side. A `shared/` package is optional for Phase 2+ once the FE + BE need to share non-trivial types beyond what `zod` schemas already cover.

```text
SkillGauge/
|-- .github/
|-- ARCHITECTURE.md
|-- PROGRESS.md
|-- IMPLEMENTATION_STATUS.md
|-- README.md
|-- LICENSE
|-- audits/
|-- web/                         # Next.js FE (exists)
|-- backend/                     # Fastify BE (exists)
`-- shared/                      # optional — lift when duplicated across FE+BE
    |-- types/
    `-- constants/
```

### Responsibility split

**Frontend (`web/`)** — routing, page composition, forms, UI components, loading/error states, react-query cache, auth gating, transcript rendering.

**Backend (`backend/`)** — auth + identity, session + message persistence, LLM orchestration behind `LLMClient`, vector retrieval (Phase 3), progress aggregation (Phase 3).

**Shared (optional)** — non-trivial types and constants shared across FE + BE. Today zod schemas + `services/api.ts` types cover this informally.

---

## Suggested Build Order (updated)

### Phase 1 (✓ complete)

1. ✓ Backend service scaffold (Fastify + TS + Jest)
2. ✓ MongoDB (MongoClient + ensureIndexes) + async repos (pivoted from SQLite)
3. ✓ httpOnly cookie JWT auth (register / login / logout / `/me`)
4. ✓ Session + questions + answers routes with ownership checks
5. ✓ `LLMClient` interface with `stubClient`
6. ✓ FE swapped to real HTTP; localStorage auth replaced by `/me` query
7. ✓ Parallel CI jobs for both sides

### Phase 1.1 (✓ complete)

1. ✓ `next-themes` + `ThemeToggle` + Tailwind 4 dark palette
2. ✓ Rich setup inputs (style / difficulty / role / count / focus areas) — FE schema + BE contract + stubClient routing
3. ✓ Brand-as-home-button with in-session confirm dialog in both layouts
4. ✓ Resume card in sidebar (filename + View dialog) fed from sessionStorage
5. ✓ Resume-swap archive guard writing to `localStorage[archived_sessions]`
6. ✓ `STORAGE_KEYS` centralized (session/archived/active/jobDescription/options)
7. ✓ Tests bumped to 23 FE + 13 BE = 36 green

### Phase 2

1. Implement `openaiClient` (or `anthropicClient`) against `LLMClient`
2. Add resume/JD parsers (PDF / DOC / DOCX → text)
3. Versioned prompt templates + rubric
4. Rate limits + cost guardrails
5. Prompt regression fixtures

### Phase 3

1. Harden Mongo persistence (managed Atlas, replica-set tuning, connection pool)
2. Embeddings provider + vector DB (Atlas Vector Search or Pinecone)
3. `GET /api/sessions` list endpoint + progress aggregation endpoints
4. FE dashboard page + cross-session context surfaced in prompts

### Phase 4

1. E2E Playwright
2. Sentry + Pino log shipping
3. Rate limits + Helmet-equivalent + CSRF where applicable
4. Object storage for resume files
5. Deploy targets (Vercel + Fly.io / Railway) + prod envs

---

## Final Summary

- Frontend: real, tested, building clean. Dark mode, rich setup inputs, brand-as-home navigation, resume card, and archive guard all shipped in Phase 1.1.
- Backend: real, tested, building clean. Persists to MongoDB, auth via httpOnly cookie JWT, AI behind a stubbed interface that now routes by style + difficulty + role.
- External dependencies today: **MongoDB only** (local docker or Atlas M0). No API keys. Tests are fully in-process via `mongodb-memory-server`.
- Next major milestone: Phase 2 — swap `stubClient` for a real LLM provider without changing any consumer of the `LLMClient` interface. The Phase 1.1 fields are already on `QuestionContext`, so no schema migration is required.
