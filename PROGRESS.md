# SkillGauge — Build Progress Log

Living document tracking every change made during the end-to-end build. Newest entries at the top within each phase.

**Current phase:** Phase 1.6d — Chatroom sidebar **(COMPLETE ✓)** (new `ChatroomEntry` component, sidebar reads `localStorage[archived_sessions]`, shows live + archived sessions sorted by date with relative timestamps via `Intl.RelativeTimeFormat`). **Phase 1.6 fully complete.**
**Next phase:** Phase 2b — Provider-agnostic prompt templates v1
**Then:** Phase 2 AI Intelligence (2a/2e providers → 2c parsing → 2d cost guards) → Phase 3 long-term memory + chatroom sidebar (real data) → Phase 4 production
**Started:** 2026-04-18
**Phase 0a finished:** 2026-04-18
**Phase 0b finished:** 2026-04-19
**Phase 1 finished:** 2026-04-19
**Phase 1.1 finished:** 2026-04-20
**Phase 1.5a finished:** 2026-04-25
**Phase 1.5b finished:** 2026-04-25
**Phase 1.5c finished:** 2026-04-25
**Phase 1.5d finished:** 2026-04-25
**Phase 1.5e finished:** 2026-04-25 (Phase 1.5 fully complete)
**Phase 1.6a finished:** 2026-04-25
**Phase 1.6b finished:** 2026-04-25
**Phase 1.6c finished:** 2026-04-25
**Phase 1.6d finished:** 2026-04-25 (Phase 1.6 fully complete)

---

## Phase 0a — Harden FE ✓

### Goals
- ✓ Add react-query to replace ad-hoc promise handling in hooks
- ✓ Add zod + react-hook-form for form validation
- ✓ Add vitest + @testing-library/react for unit tests
- ✓ Fix dark-mode vs light-theme CSS mismatch
- ✓ Write parity tests so we can verify Next.js migration in 0b doesn't regress anything

### Checklist
- [x] Install deps: `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react@^5`, `@vitest/ui`
- [x] Fix theme mismatch in [skillgauge/app/root.tsx](skillgauge/app/root.tsx) (removed `className="dark"`, updated `theme-color` meta to `#fafafa`)
- [x] Add QueryClientProvider in [skillgauge/app/root.tsx](skillgauge/app/root.tsx) with client factory in [skillgauge/app/lib/queryClient.ts](skillgauge/app/lib/queryClient.ts)
- [x] Refactor [skillgauge/app/hooks/useAuth.ts](skillgauge/app/hooks/useAuth.ts) → react-query mutations for login/register
- [x] Refactor [skillgauge/app/hooks/useSession.ts](skillgauge/app/hooks/useSession.ts) → react-query mutations for init/submit
- [x] Convert [skillgauge/app/features/auth/AuthModal.tsx](skillgauge/app/features/auth/AuthModal.tsx) to react-hook-form + zod ([authSchema.ts](skillgauge/app/features/auth/authSchema.ts))
- [x] Convert [skillgauge/app/features/session-setup/SessionSetupForm.tsx](skillgauge/app/features/session-setup/SessionSetupForm.tsx) to react-hook-form + zod ([sessionSetupSchema.ts](skillgauge/app/features/session-setup/sessionSetupSchema.ts)) — enforces PDF/DOC/DOCX, ≤5MB, JD ≥50 chars
- [x] Add [vitest.config.ts](skillgauge/vitest.config.ts), setup file [skillgauge/app/test/setup.ts](skillgauge/app/test/setup.ts), `test` / `test:watch` / `test:ui` scripts
- [x] Add `QueryWrapper` test helper at [skillgauge/app/test/queryWrapper.tsx](skillgauge/app/test/queryWrapper.tsx)
- [x] Add `vitest/globals` + `@testing-library/jest-dom` to tsconfig types
- [x] Write tests (20 total, all passing):
  - [x] [authSchema.test.ts](skillgauge/app/features/auth/authSchema.test.ts) — 4 tests (valid, trim/lowercase, invalid email, short password)
  - [x] [sessionSetupSchema.test.ts](skillgauge/app/features/session-setup/sessionSetupSchema.test.ts) — 4 tests (valid PDF, wrong type, >5MB, short JD)
  - [x] [MessageBubble.test.tsx](skillgauge/app/features/interview/MessageBubble.test.tsx) — 4 tests (question, answer, feedback, null)
  - [x] [useAuth.test.tsx](skillgauge/app/hooks/useAuth.test.tsx) — 4 tests (unauth hydration, auth hydration, login persist, logout clears)
  - [x] [useSession.test.tsx](skillgauge/app/hooks/useSession.test.tsx) — 4 tests (empty init, init + first question, answer/feedback append, completion after N questions)
- [x] Green: `npm run typecheck && npm test && npm run build && npm run dev` all pass

### Final verification (2026-04-18)

| Command | Status |
|---|---|
| `npm run typecheck` | ✓ clean |
| `npm test` | ✓ 20/20 tests pass across 5 files (~26s) |
| `npm run build` | ✓ client + SSR bundles built (8.89s + 554ms) |
| `npm run dev` + `curl localhost:5173` | ✓ HTTP 200 |

### Changelog

- **2026-04-18 23:50** — Phase 0a complete. All tests green, build green, dev server boots. Cleaned up unused `XCircle` import in MessageBubble after build surfaced warning.
- **2026-04-18 23:48** — Fixed Node 24 native `localStorage` (lacks `clear`/`removeItem`) shadowing jsdom's by installing a `MemoryStorage` polyfill in [setup.ts](skillgauge/app/test/setup.ts). All 20 tests now pass.
- **2026-04-18 23:47** — Relaxed `FileList` check in zod to duck-typed `ArrayLike<File>` (jsdom 29 doesn't expose `DataTransfer`; also usable from node).
- **2026-04-18 23:47** — Created 5 test files covering hooks + components + schemas.
- **2026-04-18 23:45** — Vitest + RTL + jsdom configured via separate [vitest.config.ts](skillgauge/vitest.config.ts) (decoupled from React Router's vite config).
- **2026-04-18 23:43** — Converted [SessionSetupForm](skillgauge/app/features/session-setup/SessionSetupForm.tsx) to RHF + zod, including file type / size / JD length validation.
- **2026-04-18 23:41** — Converted [AuthModal](skillgauge/app/features/auth/AuthModal.tsx) to RHF + zod schema.
- **2026-04-18 23:38** — Refactored [useSession](skillgauge/app/hooks/useSession.ts) with `useMutation` for init + answer flows; consolidated state transitions.
- **2026-04-18 23:36** — Refactored [useAuth](skillgauge/app/hooks/useAuth.ts) with `useMutation` for login/register; preserved localStorage hydration + public API.
- **2026-04-18 23:33** — Wired `QueryClientProvider` in [root.tsx](skillgauge/app/root.tsx); created [queryClient.ts](skillgauge/app/lib/queryClient.ts) with sensible defaults (30s staleTime, retry: 1, no window-focus refetch).
- **2026-04-18 23:32** — Fixed theme mismatch: removed `className="dark"` from `<html>` (CSS was light-only) and updated `theme-color` meta to `#fafafa`.
- **2026-04-18 23:30** — Installed deps. Pinned `@vitejs/plugin-react@^5` for Vite 7 peer compatibility.

### Files touched

**Created:**
- [skillgauge/app/lib/queryClient.ts](skillgauge/app/lib/queryClient.ts)
- [skillgauge/app/features/auth/authSchema.ts](skillgauge/app/features/auth/authSchema.ts)
- [skillgauge/app/features/auth/authSchema.test.ts](skillgauge/app/features/auth/authSchema.test.ts)
- [skillgauge/app/features/session-setup/sessionSetupSchema.ts](skillgauge/app/features/session-setup/sessionSetupSchema.ts)
- [skillgauge/app/features/session-setup/sessionSetupSchema.test.ts](skillgauge/app/features/session-setup/sessionSetupSchema.test.ts)
- [skillgauge/app/features/interview/MessageBubble.test.tsx](skillgauge/app/features/interview/MessageBubble.test.tsx)
- [skillgauge/app/hooks/useAuth.test.tsx](skillgauge/app/hooks/useAuth.test.tsx)
- [skillgauge/app/hooks/useSession.test.tsx](skillgauge/app/hooks/useSession.test.tsx)
- [skillgauge/app/test/setup.ts](skillgauge/app/test/setup.ts)
- [skillgauge/app/test/queryWrapper.tsx](skillgauge/app/test/queryWrapper.tsx)
- [skillgauge/vitest.config.ts](skillgauge/vitest.config.ts)

**Modified:**
- [skillgauge/app/root.tsx](skillgauge/app/root.tsx)
- [skillgauge/app/hooks/useAuth.ts](skillgauge/app/hooks/useAuth.ts)
- [skillgauge/app/hooks/useSession.ts](skillgauge/app/hooks/useSession.ts)
- [skillgauge/app/features/auth/AuthModal.tsx](skillgauge/app/features/auth/AuthModal.tsx)
- [skillgauge/app/features/session-setup/SessionSetupForm.tsx](skillgauge/app/features/session-setup/SessionSetupForm.tsx)
- [skillgauge/app/features/interview/MessageBubble.tsx](skillgauge/app/features/interview/MessageBubble.tsx) (unused import removed)
- [skillgauge/package.json](skillgauge/package.json) (scripts + deps)
- [skillgauge/tsconfig.json](skillgauge/tsconfig.json) (types)

### Notable gotchas encountered

1. **Node 24 + jsdom localStorage conflict** — Node 24 ships an experimental global `localStorage` that lacks `clear` / `removeItem`. It shadowed jsdom's full Storage. Solved with a `MemoryStorage` polyfill forced via `Object.defineProperty` in [setup.ts](skillgauge/app/test/setup.ts).
2. **`DataTransfer` missing in jsdom 29** — Normal way to build a `FileList` in tests is via `new DataTransfer()`. Not available. Relaxed zod schema to accept any `ArrayLike<File>` (duck-typed), which also makes schemas reusable from non-browser contexts.
3. **@vitejs/plugin-react peer mismatch** — Latest v6 requires Vite 8; pinned to `^5` for current Vite 7 stack.
4. **React Router vite plugin + vitest** — Kept vitest config separate from `vite.config.ts` so vitest doesn't try to boot React Router's dev server runtime.

---

## Phase 0b — Next.js App Router Migration ✓

### Goals
- ✓ Replace React Router 7 with Next.js 16 App Router
- ✓ Swap Vitest for Jest (`next/jest`) and re-author 20 tests
- ✓ Create ARCHITECTURE.md with mermaid diagrams + entry points
- ✓ Delete skillgauge/ once migration was green
- ✓ Update CI + README to point at web/

### Final verification (2026-04-19)

| Command | Status |
|---|---|
| `npx tsc --noEmit` | ✓ clean |
| `npm test` (Jest) | ✓ 20/20 tests pass across 5 files (~27s) |
| `npm run build` | ✓ 4 static routes built (compile 4.4s, TS 5.5s) |
| `npm run dev` + smoke curl | ✓ `/`, `/setup`, `/interview` → 200; `/bogus` → 404 |

### Changelog

- **2026-04-19** — Phase 0b complete. Deleted `skillgauge/` RR7 app. Updated [.github/workflows/ci.yml](.github/workflows/ci.yml) to build `web/`, updated [README.md](README.md) to point at `web/`, added [ARCHITECTURE.md](ARCHITECTURE.md).
- **2026-04-19** — All 20 ported tests green under Jest. Next build green. Dev server smoke test green.
- **2026-04-19** — Ported pages + layouts: `app/layout.tsx`, `app/providers.tsx`, `app/page.tsx`, `app/setup/page.tsx`, `app/interview/page.tsx`, `app/not-found.tsx`, `app/error.tsx`. Swapped `useNavigate` → `useRouter`, `useLocation` → `usePathname`.
- **2026-04-19** — Ported features with `"use client"` pragmas where hooks/event handlers required: `AuthModal`, `SessionSetupForm`, `AnswerInput`. Static presentational components (`MessageBubble`, `InterviewHeader`, `InterviewSidebar`, `TypingIndicator`, `InterviewLayout`) stay server components.
- **2026-04-19** — Merged `skillgauge/app/styles/app.css` theme into `web/app/globals.css` (Tailwind 4 `@theme` tokens, animations, sidebar color).
- **2026-04-19** — Ported 6 shadcn primitives, both hooks, both zod schemas, `lib/utils.ts`, `lib/queryClient.ts`, `services/api.ts`. Changed empty-interface shims to type aliases to satisfy ESLint `no-empty-object-type`.
- **2026-04-19** — Set up Jest via `next/jest` with `moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" }` and same MemoryStorage polyfill from Phase 0a in `jest.setup.ts`.
- **2026-04-19** — Moved `themeColor` from `metadata` to `viewport` export (Next 16 requirement).
- **2026-04-19** — Pinned `turbopack.root` in `next.config.ts` to silence multiple-lockfile warning.
- **2026-04-19** — Scaffolded `web/` via `create-next-app` (Next 16.2.4, TS, Tailwind 4, App Router, `@/*` alias).

### Files created

- [ARCHITECTURE.md](ARCHITECTURE.md)
- `web/` — entire Next.js app (all files)

### Files deleted

- `skillgauge/` — entire RR7 app

### Files modified

- [.github/workflows/ci.yml](.github/workflows/ci.yml) — working-directory + build steps point at `web/`
- [README.md](README.md) — tech stack + run commands point at `web/`
- [PROGRESS.md](PROGRESS.md) — this phase

### Notable gotchas encountered

1. **`lucide-react` peer pin** — `create-next-app` wrote `"lucide-react": "^1.8.0"`, but Next/React 19 compatibility required the current major. Kept what was installed; icons rendered correctly in the build.
2. **`create-next-app` npm install crash** — A pnpm-shadowed `npm@9.9.3` under `C:\Users\kunayan\node_modules\.pnpm\` failed mid-install (`Cannot find module 'semver/functions/satisfies'`). Ran system npm (`/c/Program Files/nodejs/npm install`) directly to recover.
3. **`themeColor` in `metadata`** — Next 16 emits a warning and ignores it; must live on the separate `viewport` export.
4. **ESLint `no-empty-object-type`** — Ported shadcn primitives used `interface X extends React.X {}`. Rewrote as `type X = React.X` to pass strict lint.
5. **Turbopack lockfile confusion** — Next picked a parent `pnpm-lock.yaml` as root. Pinned `turbopack.root` in `next.config.ts` to `web/`.

---

## Phase 1 — Real Backend w/ Stubbed AI ✓

### Goals
- ✓ Stand up a real HTTP API in [backend/](backend/) (Fastify + TypeScript)
- ✓ Persist users / sessions / messages in MongoDB (official `mongodb` driver; pivoted 2026-04-19)
- ✓ Replace localStorage auth with httpOnly JWT cookie + `GET /api/me`
- ✓ Introduce `LLMClient` abstraction with a deterministic `stubClient`
- ✓ Swap [web/services/api.ts](web/services/api.ts) from in-process mock → real `fetch`
- ✓ Extend CI to build + test both `web/` and `backend/` in parallel
- ✓ Apply top findings from the Phase 0b code-duplication audit (storage keys, accept-attr constant)
- ✓ Minimal external dependency — MongoDB (local docker or Atlas M0 free tier); `stubClient` is in-process; tests use `mongodb-memory-server` (zero deps)

### Checklist
- [x] `backend/` scaffold: `package.json`, `tsconfig.json` (CJS + Node resolve + `@/*` paths), `jest.config.ts`, `.env.example`
- [x] [backend/src/config/env.ts](backend/src/config/env.ts) — zod-validated env schema (dev fallback for `JWT_SECRET`, fatal in prod)
- [x] [backend/src/db/connection.ts](backend/src/db/connection.ts) — `MongoClient` singleton + `getDb()` / `closeDb()` (reads `process.env.MONGODB_URI` at call time so tests can swap URIs)
- [x] [backend/src/db/indexes.ts](backend/src/db/indexes.ts) — idempotent `createIndex` for `users.email` unique, `sessions.userId`, `messages.sessionId`, partial-unique `messages.{sessionId, questionIndex}` (enforces one question per slot at the storage layer)
- [x] Repos: [users.ts](backend/src/db/repos/users.ts), [sessions.ts](backend/src/db/repos/sessions.ts), [messages.ts](backend/src/db/repos/messages.ts) — all async, camelCase fields, UUID string `_id`
- [x] [backend/src/llm/LLMClient.ts](backend/src/llm/LLMClient.ts) + [stubClient.ts](backend/src/llm/stubClient.ts) + [index.ts](backend/src/llm/index.ts) factory on `LLM_PROVIDER`
- [x] [backend/src/plugins/auth.ts](backend/src/plugins/auth.ts) — `signSessionToken`, `setSessionCookie` (httpOnly / sameSite=lax / secure in prod), `requireAuth` preHandler
- [x] [backend/src/modules/auth/](backend/src/modules/auth/) — schema + service (`AuthError`) + routes (register / login / logout / me)
- [x] [backend/src/modules/sessions/](backend/src/modules/sessions/) — schema + service (`loadOwnedSession`) + routes (init / get question / submit answer)
- [x] [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts) — `GET /api/health`
- [x] [backend/src/app.ts](backend/src/app.ts) — `buildApp()` factory (separate from `listen` for `app.inject()` in tests)
- [x] [backend/src/index.ts](backend/src/index.ts) — bootstrap with migrate-on-boot
- [x] Tests: [auth.test.ts](backend/tests/auth.test.ts) (6) + [sessions.test.ts](backend/tests/sessions.test.ts) (5), per-suite `mongodb-memory-server` via [mongoHarness.ts](backend/tests/mongoHarness.ts); DB dropped between tests
- [x] [backend/tsconfig.build.json](backend/tsconfig.build.json) + main `tsconfig.json` split — main typechecks `src/` + `tests/`; build excludes `tests/` and writes `dist/` from `rootDir: src` only
- [x] FE: [web/services/api.ts](web/services/api.ts) rewritten — real `fetch` with `credentials: "include"`, `ApiError`, new exports `fetchMe`, `logoutUser`, updated `initializeSession`/`submitAnswer` shapes
- [x] FE: [web/hooks/useAuth.ts](web/hooks/useAuth.ts) rewritten — `useQuery({ queryFn: fetchMe })` replaces localStorage hydration; `logoutMutation` clears react-query cache
- [x] FE: [web/hooks/useSession.ts](web/hooks/useSession.ts) rewritten — single-tick atomic append of `[answer, feedback, next]` from backend's batched answer response
- [x] FE: [web/lib/storageKeys.ts](web/lib/storageKeys.ts) + `ACCEPTED_RESUME_ACCEPT_ATTR` in [sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts) (audit #1 + #2)
- [x] FE: [SessionSetupForm](web/features/session-setup/SessionSetupForm.tsx) reads resume via `FileReader` and stashes `{resumeFileName, resumeContent}` JSON in sessionStorage; [/interview page](web/app/interview/page.tsx) parses it and passes real bytes to `initializeSession`
- [x] FE: [web/.env.local.example](web/.env.local.example) added (`NEXT_PUBLIC_API_BASE_URL`)
- [x] FE tests: [useAuth.test.tsx](web/hooks/useAuth.test.tsx) + [useSession.test.tsx](web/hooks/useSession.test.tsx) rewritten to mock `@/services/api` directly; 5 + 4 tests
- [x] CI: [.github/workflows/ci.yml](.github/workflows/ci.yml) rewritten — two parallel jobs (`web`, `backend`) each running install → typecheck → test → build
- [x] Explanatory comments added where non-obvious (FE hooks, services, interview page; backend plugins, services, schema, stubClient)

### Final verification (2026-04-19)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 11/11 tests pass (auth + sessions) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd backend && npm run migrate` | ✓ idempotent, runs `ensureIndexes()` against `MONGODB_URI` |
| `cd web && npx tsc --noEmit` | ✓ clean |
| `cd web && npm test -- --ci` | ✓ 21/21 tests pass (up from 20 — added register-error case) |
| `cd web && npm run build` | ✓ 4 static routes built |

### Changelog

- **2026-04-19** — Phase 1 complete. ARCHITECTURE.md, PROGRESS.md, IMPLEMENTATION_STATUS.md updated to reflect real backend.
- **2026-04-19** — CI rewritten to two parallel jobs; each job runs install → typecheck → test → build in its working directory.
- **2026-04-19** — FE tests rewritten: `jest.mock("@/services/api")` with typed `MockedFunction`s. Logout test models cookie-cleared → `/me` 401 → null user.
- **2026-04-19** — FE `useSession` collapses the old init → getNextQuestion chain: `POST /api/sessions` now returns `{ session, firstQuestion }` atomically. `submitAnswer` returns `{ answerMsg, feedback, nextQuestion, isComplete }` → single-tick state append avoids flicker.
- **2026-04-19** — FE `useAuth` rewritten around `useQuery({ queryFn: fetchMe })` — no localStorage, no hydration flag. `logout` calls backend then `queryClient.clear()`.
- **2026-04-19** — [web/services/api.ts](web/services/api.ts) rewritten end-to-end with real `fetch`, `credentials: "include"`, `ApiError`, centralized `apiFetch<T>`. `API_BASE` = `process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"`.
- **2026-04-19** — Resume data flow: setup form `FileReader.readAsText` → JSON in sessionStorage → interview page `JSON.parse` → pass real bytes to `POST /api/sessions`. Replaces old pattern of synthesizing a fake session_id client-side.
- **2026-04-19** — Audit #1 + #2 applied: `STORAGE_KEYS` constant in [web/lib/storageKeys.ts](web/lib/storageKeys.ts), `ACCEPTED_RESUME_ACCEPT_ATTR` exported from [sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts).
- **2026-04-19** — Backend routes: `/api/auth/{register,login,logout}`, `/api/me`, `/api/sessions`, `/api/sessions/:id/questions/:index`, `/api/sessions/:id/answers`. All session routes protected with `app.addHook("preHandler", requireAuth)`.
- **2026-04-19** — Session ownership centralized in `loadOwnedSession(userId, sessionId)` — 403 if mismatch. Question fetch is idempotent via `(session_id, type='question', question_index)` index — page refresh or race doesn't burn an LLM call.
- **2026-04-19** — `stubClient`: picks from 5 canned questions indexed by `questionIndex`, scores answers by length bucket with fixed strengths/improvements. Matches Phase 0b mock behavior so FE contract stays stable.
- **2026-04-19** — `LLMClient` interface with `generateQuestion(ctx)` + `gradeAnswer(q, a, ctx)`. Factory switches on `LLM_PROVIDER` (`stub` today; `openai`/`anthropic` throw "not implemented" — Phase 2 hook).
- **2026-04-19** — Auth plugin: JWT `{ sub: userId }`, HS256, 7-day expiry. Cookie `skillgauge_session`, httpOnly, sameSite=lax, secure in prod, path=/. `requireAuth` preHandler verifies + loads user onto `request.user`; 401 on missing/expired/tampered cookie.
- **2026-04-19** — **Pivoted Phase 1 persistence from SQLite to MongoDB.** Dropped `better-sqlite3` + `@types/better-sqlite3`; added `mongodb@^7.1.1` + `mongodb-memory-server@^11.0.1` (dev). Rewrote `db/connection.ts` as a `MongoClient` singleton, replaced `migrate.ts` with `indexes.ts` (idempotent `createIndex`), converted all repos + services to async, switched tests to a per-suite `mongodb-memory-server` harness. `env.ts`: `DATABASE_URL` → `MONGODB_URI` + `MONGODB_DB`. FE unchanged — same wire contract, same UUID string IDs. Split `tsconfig.build.json` so `rootDir: src` stays clean for `dist/` while the main tsconfig typechecks tests too.
- **2026-04-19** — DB schema (Mongo): collections `users`, `sessions`, `messages` — UUID strings as `_id`, camelCase fields. Indexes: `users.email` unique, `sessions.userId`, `messages.sessionId`, partial-unique `messages.{sessionId, questionIndex}` (enforces idempotent question slots at the storage layer; prior SQL version used a composite index + app-level check).
- **2026-04-19** — Scaffolded `backend/` with Fastify 5.8.5, @fastify/cookie 11.0.2, @fastify/cors 11.2.0, bcryptjs 3.0.3, jsonwebtoken 9.0.3, zod 4.3.6, dotenv 17.4.2, `mongodb` 7.1.1; dev Jest 30 + ts-jest 29 + tsx 4 + `mongodb-memory-server` 11.0.1.

### Files created

**backend (new):**
- [backend/package.json](backend/package.json), [backend/tsconfig.json](backend/tsconfig.json), [backend/jest.config.ts](backend/jest.config.ts), [backend/.env.example](backend/.env.example)
- [backend/src/config/env.ts](backend/src/config/env.ts)
- [backend/src/shared/types.ts](backend/src/shared/types.ts)
- [backend/src/db/connection.ts](backend/src/db/connection.ts), [indexes.ts](backend/src/db/indexes.ts), [repos/users.ts](backend/src/db/repos/users.ts), [repos/sessions.ts](backend/src/db/repos/sessions.ts), [repos/messages.ts](backend/src/db/repos/messages.ts)
- [backend/src/llm/LLMClient.ts](backend/src/llm/LLMClient.ts), [stubClient.ts](backend/src/llm/stubClient.ts), [index.ts](backend/src/llm/index.ts)
- [backend/src/plugins/auth.ts](backend/src/plugins/auth.ts)
- [backend/src/modules/auth/auth.schema.ts](backend/src/modules/auth/auth.schema.ts), [auth.service.ts](backend/src/modules/auth/auth.service.ts), [auth.routes.ts](backend/src/modules/auth/auth.routes.ts)
- [backend/src/modules/sessions/sessions.schema.ts](backend/src/modules/sessions/sessions.schema.ts), [sessions.service.ts](backend/src/modules/sessions/sessions.service.ts), [sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts)
- [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts)
- [backend/src/app.ts](backend/src/app.ts), [backend/src/index.ts](backend/src/index.ts)
- [backend/tests/setup.ts](backend/tests/setup.ts), [mongoHarness.ts](backend/tests/mongoHarness.ts), [auth.test.ts](backend/tests/auth.test.ts), [sessions.test.ts](backend/tests/sessions.test.ts)
- [backend/tsconfig.build.json](backend/tsconfig.build.json)

**web (new):**
- [web/lib/storageKeys.ts](web/lib/storageKeys.ts)
- [web/.env.local.example](web/.env.local.example)

### Files modified

**web:**
- [web/services/api.ts](web/services/api.ts) — full rewrite to real HTTP
- [web/hooks/useAuth.ts](web/hooks/useAuth.ts) — `useQuery` on `/me`, no localStorage
- [web/hooks/useSession.ts](web/hooks/useSession.ts) — batched answer response consumer
- [web/hooks/useAuth.test.tsx](web/hooks/useAuth.test.tsx) — rewritten around `jest.mock("@/services/api")`
- [web/hooks/useSession.test.tsx](web/hooks/useSession.test.tsx) — same
- [web/features/session-setup/sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts) — adds `ACCEPTED_RESUME_ACCEPT_ATTR`
- [web/features/session-setup/SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx) — imports `STORAGE_KEYS`, adds `readFileAsText` helper, stashes JSON payload
- [web/app/interview/page.tsx](web/app/interview/page.tsx) — reads STORAGE_KEYS, `JSON.parse` resume payload
- [.github/workflows/ci.yml](.github/workflows/ci.yml) — two parallel jobs for `web/` + `backend/`

**docs:**
- [ARCHITECTURE.md](ARCHITECTURE.md) — expanded to cover full stack; §4 system context now solid to backend; added backend module map, HTTP surface, DB schema, auth model, LLM abstraction, env/local-dev section, per-phase external-credentials table
- [PROGRESS.md](PROGRESS.md) — this section
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — reflects real backend exists

### External credentials / endpoints needed

**Phase 1: MongoDB only.** Either run local (`docker run -d -p 27017:27017 mongo:7`) or point `MONGODB_URI` at a MongoDB Atlas M0 free-tier cluster. No API keys. `stubClient` is in-process. Tests require nothing (spin up disposable mongod via `mongodb-memory-server`).

What you *will* need in later phases is documented in [ARCHITECTURE.md §21](ARCHITECTURE.md).

### Notable gotchas encountered

1. **Mongo driver is async-all-the-way** — switching from `better-sqlite3` (sync) meant every repo call became `await`-ed. Propagated through auth.service + sessions.service, including `loadOwnedSession` which became async. FE wire contract unaffected.
2. **Env late-binding in `db/connection.ts`** — `env.ts` runs at import time, but `mongodb-memory-server` chooses its URI after `beforeAll(startMongo)`. Fixed by reading `process.env.MONGODB_URI` directly at call time in `getDb()` (falling back to the parsed `env` object), so the test harness can set env before `buildApp()` triggers the first connection.
3. **Per-suite `mongodb-memory-server`, not globalSetup** — Jest globalSetup env writes don't reach worker processes. Pattern: `beforeAll(startMongo)` / `afterAll(stopMongo)` in each describe, and `beforeEach(resetDb → buildApp)` / `afterEach(app.close)`. One mongod per test file; DB dropped between tests (cheaper than restarting mongod).
4. **UUID strings as `_id`, not `ObjectId`** — keeps the wire contract identical to Phase 0b (opaque string IDs), so no FE migration needed.
5. **Idempotency via partial unique index** — prior SQL version used `(session_id, type, question_index)` + app check. Mongo version uses `{ sessionId, questionIndex }` unique with `partialFilterExpression: { type: "question", questionIndex: { $exists: true } }`, so the storage layer enforces "at most one question per slot" and the service can rely on `findOne`/`insertOne` without a race window.
6. **TS6059 rootDir conflict** — after adding `tests/mongoHarness.ts`, `rootDir: "src"` + `include: ["src/**/*", "tests/**/*"]` surfaced the tests-are-outside-rootDir error. Fixed by splitting: main `tsconfig.json` drops `rootDir` + `outDir` and is `noEmit`; new `tsconfig.build.json` sets `rootDir: "src"` + `outDir: "dist"` for `npm run build`.
7. **`@types/bcryptjs` is deprecated** — bcryptjs 3.x ships its own types. No `@types` dep.
8. **TS2688 "Cannot find type definition file for 'prop-types'"** — a global types leak from the user's home `node_modules`. Fixed by pinning `"types": ["node", "jest"]` in `backend/tsconfig.json`.
9. **`import.meta` rejected by CommonJS** — `indexes.ts` uses `if (require.main === module)` for CLI-mode detection (carried over from the old migrate.ts).
10. **Native `localStorage` is gone from the FE auth path** — `useAuth` test models "cookie cleared → /me 401 → user is null" by resolving `fetchMe` to `null` before `logout()` and awaiting the query.
11. **CORS + credentials** — `@fastify/cors` with `credentials: true` rejects `origin: "*"`. `CORS_ORIGIN` must be an explicit origin (or comma-separated list).
12. **Cookie `secure` flag** — set only in `NODE_ENV=production` so localhost testing works without HTTPS. `sameSite=lax` degrades cleanly across tabs.
13. **Test timeout bumped to 60s** — `mongodb-memory-server` downloads a ~60MB mongod binary on first run per machine; subsequent runs are fast.

---

---

## Phase 1.1 — UX Enhancements ✓

Pre-Phase-2 polish based on user-driven UI feedback. All FE-only (plus stub + schema extensions) — backend keeps the same contract shape with additive fields. No new external dependencies besides `next-themes`.

### Goals
- ✓ Dark-mode toggle with system-default detection
- ✓ Clickable brand + home button that correctly reroute to `/` with a confirm guard if an interview is in progress
- ✓ Surface the current resume (filename + text preview) in the interview sidebar
- ✓ Guard against swapping resume mid-session — archive the snapshot locally and alert the user before starting a new one
- ✓ Richer setup inputs: interview style, difficulty, role level, question count, focus areas — wired through to the stub so branches are observable today
- ✓ Keep FE + BE test suites green and the backend wire contract forward-compatible with Phase 2's real LLM

### Checklist
- [x] [web/app/providers.tsx](web/app/providers.tsx) — wrap tree in `next-themes` `ThemeProvider` (attribute="class", system default, `disableTransitionOnChange`)
- [x] [web/app/layout.tsx](web/app/layout.tsx) — `<html suppressHydrationWarning>` to silence next-themes hydration warning
- [x] [web/app/globals.css](web/app/globals.css) — Tailwind 4 `@custom-variant dark`; dark-mode CSS var palette under `.dark`
- [x] [web/components/ThemeToggle.tsx](web/components/ThemeToggle.tsx) — mounted-gated Sun/Moon toggle (reusable)
- [x] [web/components/AppLayout.tsx](web/components/AppLayout.tsx) — brand wrapped in `<button>` with `aria-label="Go home"`, ThemeToggle in header
- [x] [web/features/interview/InterviewHeader.tsx](web/features/interview/InterviewHeader.tsx) — rightmost home button + ThemeToggle; confirmation dialog when session is active
- [x] [web/features/interview/InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx) — brand-as-home-button; resume card with filename + "View" modal showing the text snapshot; single active-session entry
- [x] [web/app/interview/page.tsx](web/app/interview/page.tsx) — reads `STORAGE_KEYS.session.options` in the init effect; clears `STORAGE_KEYS.session.active` on completion; passes `resumeFileName`/`isActive` down to sidebar+header
- [x] [web/features/session-setup/sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts) — new enums `INTERVIEW_STYLES`, `DIFFICULTY_LEVELS`, `ROLE_LEVELS`, `QUESTION_COUNTS`; enum-of-strings for `questionCount` + transform to number; split `SessionSetupFormInput` / `SessionSetupFormValues` to keep RHF's pre-transform type clean
- [x] [web/features/session-setup/SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx) — native `<select>` inputs for style/difficulty/role/count, optional `focusAreas` text input; writes `STORAGE_KEYS.session.options` and `STORAGE_KEYS.session.active`; Dialog-based archive-confirm before overwriting an active session
- [x] [web/lib/storageKeys.ts](web/lib/storageKeys.ts) — added `options`, `archived`, `active` keys
- [x] [web/services/api.ts](web/services/api.ts) — added `InterviewStyle` / `DifficultyLevel` / `RoleLevel` / `SessionOptions` types; `SessionInitRequest extends SessionOptions`
- [x] [backend/src/shared/types.ts](backend/src/shared/types.ts) — mirror the new enums; extend `SessionInitRequest`
- [x] [backend/src/modules/sessions/sessions.schema.ts](backend/src/modules/sessions/sessions.schema.ts) — add enum fields + `questionCount` refinement against the tuple
- [x] [backend/src/db/repos/sessions.ts](backend/src/db/repos/sessions.ts) — store `interviewStyle`, `difficulty`, `roleLevel`, `focusAreas` on the session doc
- [x] [backend/src/llm/LLMClient.ts](backend/src/llm/LLMClient.ts) — extend `QuestionContext` with the same four options
- [x] [backend/src/llm/stubClient.ts](backend/src/llm/stubClient.ts) — replace single-bank flat array with behavioral / technical-by-difficulty banks + mixed interleave + role-level suffix; length-proxy score now scales by difficulty. **Removed** `STUB_TOTAL_QUESTIONS` export — total now comes from `request.questionCount`.
- [x] [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) — `totalQuestions = request.questionCount`, new `titleFor()` builds "Mid Mixed Interview" etc., `ctxFromSession()` helper threads the new fields through every LLM call
- [x] [backend/tests/sessions.test.ts](backend/tests/sessions.test.ts) — updated payloads; added tests for invalid interview style (400) and difficulty=hard question selection
- [x] [web/features/session-setup/sessionSetupSchema.test.ts](web/features/session-setup/sessionSetupSchema.test.ts) — added coverage for unsupported question count + invalid interview style

### Final verification (2026-04-20)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 13/13 tests pass (11 Phase 1 + 2 new) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit` | ✓ clean |
| `cd web && npm test -- --ci` | ✓ 23/23 tests pass (21 Phase 1 + 2 new schema cases) |
| `cd web && npm run build` | ✓ 4 static routes built |

### Changelog

- **2026-04-20** — Phase 1.1 complete. ARCHITECTURE.md, PROGRESS.md, IMPLEMENTATION_STATUS.md updated to reflect the new UX surface + backend contract.
- **2026-04-20** — stubClient reorganized: three banks (behavioral, technical-by-difficulty, mixed = interleaved). `ROLE_SUFFIX` map appended only to non-behavioral questions so behavioral prompts stay natural. Length-proxy score divisor now scales with difficulty (`easy:10, medium:15, hard:25`). `STUB_TOTAL_QUESTIONS` export removed — no caller depended on it outside tests.
- **2026-04-20** — `sessions.service.initialize()` now sets `totalQuestions` from the request, titles via `${RoleLabel} ${StyleLabel} Interview`. All `generateQuestion` / `gradeAnswer` callers pass the enriched context via `ctxFromSession()` — keeps the shape in one place.
- **2026-04-20** — Session doc persists `interviewStyle`, `difficulty`, `roleLevel`, `focusAreas` so Phase 2's real provider can reconstruct the same prompt without re-reading the request payload.
- **2026-04-20** — Sidebar + header now treat "in progress" as a FE flag (`STORAGE_KEYS.session.active`). Flag is set by the setup form, cleared when `isComplete` flips true or the user confirms leaving. Backend is unaware — it's purely a nav guard.
- **2026-04-20** — Archive-on-swap: the setup form intercepts submit when a prior session is still marked active, shows a Dialog, and writes the previous snapshot metadata (resume + JD + options) into a `archived_sessions` array on `localStorage`. The real session + messages remain on the backend; a Phase 3 `GET /api/sessions` list will surface them properly.
- **2026-04-20** — Tailwind 4 dark-mode: uses `@custom-variant dark (&:where(.dark, .dark *))` to hook into next-themes' `class="dark"` toggle on `<html>`. Palette defined as CSS variables under `.dark {}` so Radix + shadcn components swap without code changes.
- **2026-04-20** — `questionCount` in the FE schema is now `z.enum(["3","5","7","10"]).transform(Number)`. Input type (what RHF holds) stays string; output type is a narrowed number union. This keeps `zodResolver<Input, _, Output>` happy with a native `<select>`.

### Files created / changed

**FE (new):**
- [web/components/ThemeToggle.tsx](web/components/ThemeToggle.tsx)

**FE (changed):**
- [web/app/layout.tsx](web/app/layout.tsx), [web/app/providers.tsx](web/app/providers.tsx), [web/app/globals.css](web/app/globals.css)
- [web/app/interview/page.tsx](web/app/interview/page.tsx)
- [web/components/AppLayout.tsx](web/components/AppLayout.tsx)
- [web/features/interview/InterviewHeader.tsx](web/features/interview/InterviewHeader.tsx), [InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx)
- [web/features/session-setup/SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx), [sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts), [sessionSetupSchema.test.ts](web/features/session-setup/sessionSetupSchema.test.ts)
- [web/hooks/useSession.test.tsx](web/hooks/useSession.test.tsx)
- [web/lib/storageKeys.ts](web/lib/storageKeys.ts)
- [web/services/api.ts](web/services/api.ts)

**BE (changed):**
- [backend/src/shared/types.ts](backend/src/shared/types.ts)
- [backend/src/llm/LLMClient.ts](backend/src/llm/LLMClient.ts), [stubClient.ts](backend/src/llm/stubClient.ts)
- [backend/src/db/repos/sessions.ts](backend/src/db/repos/sessions.ts)
- [backend/src/modules/sessions/sessions.schema.ts](backend/src/modules/sessions/sessions.schema.ts), [sessions.service.ts](backend/src/modules/sessions/sessions.service.ts)
- [backend/tests/sessions.test.ts](backend/tests/sessions.test.ts)

### Notable gotchas
1. Next.js warns about hydration mismatch when `next-themes` toggles `class="dark"` before React hydrates — fix is `suppressHydrationWarning` on `<html>`, not `<body>`.
2. Tailwind 4 dropped the classic `darkMode: "class"` config — you opt in per stylesheet with `@custom-variant dark (&:where(.dark, .dark *))`.
3. `z.coerce.number().refine(narrow)` poisons `z.input<>` to `unknown`, which breaks `useForm<Input, _, Output>`. Enum-of-strings + `.transform(Number)` is the clean escape hatch.
4. RHF's `useForm<Input, Context, Output>` triple is only required once you introduce a transforming resolver — worth knowing before adding more coerced fields in Phase 2.
5. The sidebar shows the resume *text snapshot* (what was sent to the backend), not the original PDF/DOC. When Phase 4 adds object storage, swap the Dialog body to an `<iframe>` pointed at the signed URL.

---

## Phase 1.5 — Auth Hardening (1.5a ✓ — others pending)

Bridges Phase 1 → Phase 2. Keeps all work local, no external keys. Small, mergeable chunks.

### 1.5a — JWT login polish ✓

#### Goals
- ✓ Verify cookie flags end-to-end in unit tests (`SameSite=Lax`, `HttpOnly`, `Path=/`); `Secure` is gated on `NODE_ENV=production` and verified by inspection (deploy-smoke deferred to Phase 4)
- ✓ Normalize error shapes across `/api/auth/*` and `requireAuth` → `{ code, message }` so FE can branch without parsing strings
- ✓ Add `POST /api/auth/login` failure logging (IP + hashed email + reason via Fastify pino; **never** the raw email or password)
- ✓ Extract `JWT_TTL_DAYS` to env (was hardcoded 7d)
- ✓ Add jest cases: expired token + tampered token → 401 `INVALID_SESSION` on `/api/me`

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 20/20 pass (was 13 — added 4 audit + 3 auth cases) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit` | ✓ clean |
| `cd web && npm test -- --ci` | ✓ 23/23 pass (no FE behavior change; `apiFetch` reshape is internal) |
| `cd web && npm run build` | ✓ 4 static routes built |

#### Error contract (now live)

| Endpoint | Status | Body |
|---|---|---|
| `POST /api/auth/register` invalid format | 400 | `{code: "INVALID_FORMAT", message: "Invalid credentials format"}` |
| `POST /api/auth/register` duplicate | 409 | `{code: "EMAIL_TAKEN", message: "Email already registered"}` |
| `POST /api/auth/login` invalid format | 400 | `{code: "INVALID_FORMAT", message: "Invalid credentials format"}` |
| `POST /api/auth/login` wrong creds | 401 | `{code: "INVALID_CREDENTIALS", message: "Invalid email or password"}` |
| `requireAuth` no cookie | 401 | `{code: "NOT_AUTHENTICATED", message: "Not authenticated"}` |
| `requireAuth` invalid/expired/tampered | 401 | `{code: "INVALID_SESSION", message: "Invalid session"}` |
| `GET /api/me` user deleted | 401 | `{code: "USER_NOT_FOUND", message: "User no longer exists"}` |

`message` strings are byte-identical to the prior `{error}` payloads — the FE display path in [AuthModal.tsx](web/features/auth/AuthModal.tsx) is unchanged. `code` is the new affordance for FE branching (consumed in 1.5b for the password-reset flow).

#### Changelog

- **2026-04-25** — Phase 1.5a complete. PROGRESS.md, ARCHITECTURE.md, IMPLEMENTATION_STATUS.md, requirements.md updated to reflect the new auth surface.
- **2026-04-25** — Added [backend/src/shared/audit.ts](backend/src/shared/audit.ts) with `hashEmailForLog(email)` (SHA-256 over trimmed/lowercased input, first 16 hex chars). Login failures emit one Fastify pino warn line: `{event: "auth.login.failed", ip, emailHash, reason}` — IP for rate context, hashed email for per-actor correlation, reason from `AuthError.code`. Phase 1.5c will count these.
- **2026-04-25** — All four `/api/auth/*` error returns + both `requireAuth` 401s switched to `{code, message}`. `AuthError.code` now propagates to the wire instead of being dropped. Sessions routes are out of explicit 1.5a scope and stay on the legacy `{error}` shape until 1.5e's contracts pass.
- **2026-04-25** — `JWT_TTL_DAYS` added to [backend/src/config/env.ts](backend/src/config/env.ts) (`z.coerce.number().int().positive().default(7)`) and [backend/.env.example](backend/.env.example). [plugins/auth.ts](backend/src/plugins/auth.ts) now derives both the JWT `expiresIn` and the cookie `maxAge` from `env.JWT_TTL_DAYS` — single source of truth.
- **2026-04-25** — FE [services/api.ts](web/services/api.ts) `ApiError` gained an optional `code` field. `apiFetch` now reads `body.code` and `body.message` with a fallback to `body.error` so non-migrated routes (sessions, health) continue to surface a usable message.
- **2026-04-25** — Tests: new [backend/tests/audit.test.ts](backend/tests/audit.test.ts) (4 tests: deterministic, normalization, distinctness, hex-prefix shape). Extended [backend/tests/auth.test.ts](backend/tests/auth.test.ts) with expired-token + tampered-token + register-malformed cases; existing assertions tightened to check `code` + `message` and broader cookie flags (`SameSite=Lax`, `Path=/`, `HttpOnly`, no `Secure` in test env).
- **2026-04-25** — Backend test count: 13 → 20.
- **2026-04-25** — End-to-end verified against MongoDB Atlas M0 (live cluster, not just `mongodb-memory-server`). Cookie round-trip via curl: register → 201 + `Max-Age=604800; Path=/; HttpOnly; SameSite=Lax` cookie; `/api/me` with cookie → 200; without cookie → 401 `{code:"NOT_AUTHENTICATED"}`; bad creds → 401 `{code:"INVALID_CREDENTIALS"}`. Pino audit log emitted two `auth.login.failed` warn lines with hashed-email + IP + reason — no raw email or password in the log.
- **2026-04-25** — `ARCHITECTURE.md` §9.1 added: full "how the session token is built and verified" walkthrough (JWT structure, sign/verify mechanics, cookie flag rationale, cross-origin handshake, rotation behavior). §13.1 added: end-to-end resume-ingestion flow (FE FileReader → sessionStorage → BE persist) + §13.2 the Phase 2c plan to plug `pdf-parse`/`mammoth` in behind the same wire contract.

#### Files created
- [backend/src/shared/audit.ts](backend/src/shared/audit.ts)
- [backend/tests/audit.test.ts](backend/tests/audit.test.ts)

#### Files modified
- [backend/src/config/env.ts](backend/src/config/env.ts) — `JWT_TTL_DAYS` schema entry
- [backend/.env.example](backend/.env.example) — `JWT_TTL_DAYS=7` row
- [backend/src/plugins/auth.ts](backend/src/plugins/auth.ts) — env-driven TTL; `requireAuth` returns `{code, message}`
- [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) — structured errors on all 4 paths; pino warn log on login failure
- [backend/tests/auth.test.ts](backend/tests/auth.test.ts) — code/message assertions + expired-token + tampered-token + register-malformed
- [web/services/api.ts](web/services/api.ts) — `ApiError.code` + apiFetch fallback chain
- [PROGRESS.md](PROGRESS.md) — this section
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — current-phase header + auth row
- [ARCHITECTURE.md](ARCHITECTURE.md) — error-contract subsection in §9
- [requirements.md](requirements.md) — `JWT_TTL_DAYS` flipped to live

#### Notable gotchas
1. **Fastify pino is off in `NODE_ENV=test`** ([app.ts:14](backend/src/app.ts)) — that's intentional, keeps test output clean. The login-failure log line is verified by inspection in dev/prod, not asserted in unit tests. The `hashEmailForLog` helper itself is unit-tested in isolation.
2. **`request.ip` behind a proxy** — Fastify only honors `X-Forwarded-For` when `trustProxy: true`. That's already on in production ([app.ts:16](backend/src/app.ts)), so logged IPs will be correct in Phase 4 deploy.
3. **`secure` cookie flag in tests** — `env.NODE_ENV` is parsed once at module load. Unit tests run in `test`, so they assert `Secure` is absent. Verifying the prod path requires a deploy smoke (Phase 4) — calling out explicitly to avoid future "why isn't this asserted?" confusion.
4. **`expiresIn: -1`** — jsonwebtoken accepts negative numbers (treated as seconds) and signs a token whose `exp` is already in the past. Cleaner than mocking `Date.now()` for the expired-token test.

---

### 1.5b — Password reset flow ✓

#### Goals
- ✓ `POST /api/auth/password/reset-request` → opaque 200 (no user enumeration), stores single-use token hash + TTL in a new `password_reset_tokens` collection
- ✓ `POST /api/auth/password/reset-confirm` → consumes token, bcrypts new password, marks token used. **Note**: session invalidation via `jwt_epoch` is deferred to 1.5d (TODO marker in place); today the old session token remains valid until natural expiry.
- ✓ FE: "Forgot password?" inline form in `AuthModal`, dedicated `/reset?token=...` route with `PasswordResetForm`
- ✓ Dev: log reset link to stdout via `request.log.info` (Phase 4 swaps to a transactional mail provider)

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 28/28 pass (was 20 — +8 password reset cases) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit` | ✓ clean |
| `cd web && npm test -- --ci` | ✓ 23/23 pass (no FE behavior regression; new components covered by manual smoke) |
| `cd web && npm run build` | ✓ static routes built (now includes `/reset`) |

#### Error contract additions

| Endpoint | Status | Body |
|---|---|---|
| `POST /api/auth/password/reset-request` (any input) | 200 | (empty) — opaque on purpose |
| `POST /api/auth/password/reset-confirm` invalid format | 400 | `{code: "INVALID_FORMAT", message: "Invalid token or password format"}` |
| `POST /api/auth/password/reset-confirm` bad/expired/used token | 400 | `{code: "INVALID_TOKEN", message: "Invalid or expired reset token"}` |

#### New collection: `password_reset_tokens`

`{_id, userId, tokenHash, expiresAt, usedAt, createdAt}`. Indexes: unique on `tokenHash`; TTL on `expiresAt` (Mongo auto-deletes expired docs within ~60s of expiry).

**Why hash, not plain token**: a DB leak doesn't expose live reset tokens. The plain token only ever lives in the email link; the BE re-hashes incoming tokens before lookup.

#### New env var
- `RESET_TTL_MIN` — default 30 (minutes). Validated by zod in [config/env.ts](backend/src/config/env.ts).

#### Changelog

- **2026-04-25** — Phase 1.5b shipped. PROGRESS.md, IMPLEMENTATION_STATUS.md, ARCHITECTURE.md, requirements.md updated.
- **2026-04-25** — New repo [backend/src/db/repos/passwordResetTokens.ts](backend/src/db/repos/passwordResetTokens.ts) with `create`, `findByHash`, `markUsed` (atomic `findOneAndUpdate` to handle parallel-confirm races). Token doc shape stores SHA-256 hex of plain token, never the plain.
- **2026-04-25** — New service [backend/src/modules/auth/password.service.ts](backend/src/modules/auth/password.service.ts) split from `auth.service.ts` (SRP). `requestReset` always returns a result (link or null); the route logs the link in dev. `confirmReset` checks not-found / expired / already-used / lost-race and collapses all four into `INVALID_TOKEN` to deny attackers any signal about which check failed.
- **2026-04-25** — Two new routes wired into [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) — `/api/auth/password/reset-request` and `/api/auth/password/reset-confirm`. Request route logs the dev-mode link via `request.log.info({event: "auth.password.reset_link_issued", emailHash, link})` — never the email itself.
- **2026-04-25** — `usersRepo` gained `updatePasswordHash(id, hash)` so the service stays at one DB call per concern (no more dynamic-import escape hatch).
- **2026-04-25** — DB indexes: `password_reset_tokens.tokenHash` unique + `expiresAt` TTL (`expireAfterSeconds: 0`). Idempotent — re-running `npm run migrate` is a no-op.
- **2026-04-25** — FE: new [web/services/api.ts](web/services/api.ts) functions `requestPasswordReset(email)` and `confirmPasswordReset(token, newPassword)`. New page [web/app/reset/page.tsx](web/app/reset/page.tsx) with `useSearchParams` (Suspense-wrapped per Next 16 requirement) showing a friendly "link broken" state if the URL has no token. New component [web/features/auth/PasswordResetForm.tsx](web/features/auth/PasswordResetForm.tsx) (RHF + zod, with confirm-password match check). [AuthModal.tsx](web/features/auth/AuthModal.tsx) refactored from 2-mode to 3-mode state machine — login / register / forgot — with an opaque success message after forgot-submit ("If that email exists...").
- **2026-04-25** — Tests: new [backend/tests/passwordReset.test.ts](backend/tests/passwordReset.test.ts) with 8 tests (opaque 200 for unknown email; token doc created on known email; happy-path consume + login with new password; expired token → INVALID_TOKEN; replayed token → INVALID_TOKEN; unknown token → INVALID_TOKEN; malformed token → INVALID_FORMAT; too-short new password → INVALID_FORMAT). Backend test count: 20 → 28.

#### Files created
- [backend/src/db/repos/passwordResetTokens.ts](backend/src/db/repos/passwordResetTokens.ts)
- [backend/src/modules/auth/password.schema.ts](backend/src/modules/auth/password.schema.ts)
- [backend/src/modules/auth/password.service.ts](backend/src/modules/auth/password.service.ts)
- [backend/tests/passwordReset.test.ts](backend/tests/passwordReset.test.ts)
- [web/features/auth/passwordResetSchema.ts](web/features/auth/passwordResetSchema.ts)
- [web/features/auth/PasswordResetForm.tsx](web/features/auth/PasswordResetForm.tsx)
- [web/app/reset/page.tsx](web/app/reset/page.tsx)

#### Files modified
- [backend/src/config/env.ts](backend/src/config/env.ts) — `RESET_TTL_MIN`
- [backend/.env.example](backend/.env.example) — same
- [backend/src/db/indexes.ts](backend/src/db/indexes.ts) — token unique + TTL indexes
- [backend/src/db/repos/users.ts](backend/src/db/repos/users.ts) — `updatePasswordHash`
- [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) — 2 new routes + import
- [web/services/api.ts](web/services/api.ts) — 2 new functions
- [web/features/auth/AuthModal.tsx](web/features/auth/AuthModal.tsx) — 3-mode machine + forgot inline form

#### Notable gotchas
1. **Why all four token-failure modes return INVALID_TOKEN**: distinguishing "expired" from "already used" from "wrong" gives an attacker a probing oracle. We deliberately collapse to one error.
2. **Atomic `markUsed` via `findOneAndUpdate`**: two parallel confirm requests racing on the same token must result in only one password change. Mongo's atomic update handles this without a transaction.
3. **`Suspense` boundary on the `/reset` page**: Next 16 throws a build error if `useSearchParams()` is used without a Suspense ancestor — it can't statically render the route otherwise.
4. **Dev stdout sink**: the link is logged via `request.log.info`, not `console.log`. Means production log shipping (Phase 4) will pick it up structured. The email-content version (Phase 4) will NOT log the link — only the issuance event.

#### TODO markers planted for future phases
```ts
// TODO:phase-1.5c add per-IP/per-email rate limit on this endpoint
// TODO:phase-1.5d bump user.jwtEpoch on confirm to invalidate existing sessions
// TODO:phase-1.5e move shared schemas into backend/src/shared/contracts.ts
// TODO:phase-4 swap stdout sink for transactional mail (SES/Resend/Postmark)
```

---

### 1.5c — Auth rate limiting + lockout ✓

#### Goals
- ✓ Per-IP rate limit on `/api/auth/login` + `/api/auth/password/reset-request` via `@fastify/rate-limit` (default 10/min, env-driven `AUTH_RATE_PER_MIN`)
- ✓ Per-email soft lockout via new `login_attempts` collection with TTL (default 5 failures in 15 min → 423 `ACCOUNT_LOCKED`, env-driven `LOGIN_LOCKOUT_THRESHOLD` + `LOGIN_LOCKOUT_WINDOW_MIN`)
- ✓ Lockout check runs **before** bcrypt — denies attackers a CPU-burn vector
- ✓ Lockout counts unknown emails too — denies enumeration via behavior-difference probing
- ✓ Successful login wipes the failure streak (explicit `clear` rather than waiting for TTL)
- ✓ Tests for both: 3 lockout cases + 1 rate-limit response-shape case

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 32/32 pass (was 28 — +4 in `rateLimit.test.ts`) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` | ✓ unchanged (FE not touched in 1.5c) |

#### Error contract additions

| Endpoint | Status | Body |
|---|---|---|
| `POST /api/auth/login` (or any rate-limited route) over IP cap | 429 | `{code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Try again in <window>."}` |
| `POST /api/auth/login` with email at lockout threshold | 423 | `{code: "ACCOUNT_LOCKED", message: "Too many failed attempts. Try again in <N> minutes or reset your password."}` |

`429` is the standard "you, the IP, are sending too many requests" response (per-process LRU). `423 Locked` (RFC 4918) is the dedicated "this account is in soft-lockout" response — distinct so the FE can show "wait <N> minutes or reset" rather than a generic "try again."

#### New collection: `login_attempts`

`{_id, emailHash, ip, failedAt, expiresAt}`. Indexes: compound `(emailHash, expiresAt)` for fast countActive(); TTL on `expiresAt` for auto-cleanup. Hashed email (SHA-256 first-16-hex via `hashEmailForLog`) — never the raw email. Same hashing function as the failed-login audit log so 1.5c's count and 1.5a's log lines are correlatable in a debug session.

#### New env vars (all optional, sensible defaults)

| Var | Default | Purpose |
|---|---|---|
| `AUTH_RATE_PER_MIN` | 10 | Per-IP requests/min on auth hot routes |
| `LOGIN_LOCKOUT_THRESHOLD` | 5 | Failed attempts before soft lockout |
| `LOGIN_LOCKOUT_WINDOW_MIN` | 15 | Rolling-window length AND lockout duration (TTL on each failure record) |

#### Changelog

- **2026-04-25** — Phase 1.5c shipped. PROGRESS.md, IMPLEMENTATION_STATUS.md, ARCHITECTURE.md, requirements.md updated.
- **2026-04-25** — Added `@fastify/rate-limit ^10.4.x` (or whichever current major). Justified: hand-rolling sliding-window in Mongo with TTL is ~80 LOC + race-prone; the plugin is 4 LOC of config and battle-tested. In-process LRU storage is fine for Phase 1's single-process deploy. **TODO:phase-4** swap to a Redis store when we go multi-instance.
- **2026-04-25** — New plugin file [backend/src/plugins/rateLimit.ts](backend/src/plugins/rateLimit.ts) registers `@fastify/rate-limit` with `global: false` (opt-in per route) and a custom `errorResponseBuilder` that returns our project-wide `{code: "RATE_LIMIT_EXCEEDED", message}` shape. Routes opt in via `config.rateLimit`.
- **2026-04-25** — Login route + password reset-request route both wired with `RATE_LIMIT_AUTH` config object. Register is intentionally NOT capped — its 409 EMAIL_TAKEN already throttles abuse and dev workflows often register multiple test accounts.
- **2026-04-25** — New repo [backend/src/db/repos/loginAttempts.ts](backend/src/db/repos/loginAttempts.ts) with `record`, `countActive`, `clear`. The collection is bounded by the TTL index — no background job needed.
- **2026-04-25** — `authService.login` extended: pre-bcrypt `loginAttemptsRepo.countActive(emailHash)` check; on `>= threshold` throws new `AuthError("ACCOUNT_LOCKED", ...)`. Failed bcrypt also records via `_recordFailure(emailHash, ip)`. Successful login calls `clear(emailHash)`.
- **2026-04-25** — Login route maps `ACCOUNT_LOCKED` to **423** (distinct from 401 `INVALID_CREDENTIALS` and 429 `RATE_LIMIT_EXCEEDED`).
- **2026-04-25** — Test infrastructure: setup.ts overrides `AUTH_RATE_PER_MIN=10000` so the lockout suite (which fires 10+ logins per case) doesn't trip the IP limiter. The dedicated rate-limit test spins up a stand-alone Fastify with `max: 2` to verify the 429 response shape.
- **2026-04-25** — Backend test count: 28 → 32.

#### Files created
- [backend/src/plugins/rateLimit.ts](backend/src/plugins/rateLimit.ts)
- [backend/src/db/repos/loginAttempts.ts](backend/src/db/repos/loginAttempts.ts)
- [backend/tests/rateLimit.test.ts](backend/tests/rateLimit.test.ts)

#### Files modified
- [backend/package.json](backend/package.json) — `+ @fastify/rate-limit`
- [backend/src/config/env.ts](backend/src/config/env.ts) — `AUTH_RATE_PER_MIN`, `LOGIN_LOCKOUT_THRESHOLD`, `LOGIN_LOCKOUT_WINDOW_MIN`
- [backend/.env.example](backend/.env.example) — same
- [backend/src/db/indexes.ts](backend/src/db/indexes.ts) — `login_attempts` indexes
- [backend/src/app.ts](backend/src/app.ts) — register the rate-limit plugin
- [backend/src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts) — lockout check + failure recording + streak clear; `AuthError.code` gains `ACCOUNT_LOCKED`
- [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) — login + reset-request opt-in to rate limit; login maps `ACCOUNT_LOCKED` → 423
- [backend/tests/setup.ts](backend/tests/setup.ts) — `AUTH_RATE_PER_MIN=10000` override

#### Notable gotchas
1. **Why 423 vs 429**: `423 Locked` (RFC 4918) means "this resource (the account) is locked." `429 Too Many Requests` means "you (the IP) are sending too many requests." They're orthogonal and a request can hit either independently — distinguishing them lets the FE show the right recovery UX.
2. **Pre-bcrypt lockout check**: order matters. Counting failures *before* hashing means a locked account doesn't waste CPU on bcrypt. Under attack this is the difference between "the server is slow" and "the server is down."
3. **Unknown emails count too**: a registered email that locks after 5 failures looks identical to an unregistered email that locks after 5 failures. No enumeration channel via behavior-difference.
4. **In-process LRU**: works for single-process Phase 1 deploy. **TODO:phase-4** swap to Redis when scaling — `@fastify/rate-limit` supports both natively, just a config change.
5. **Test isolation**: `process.env.AUTH_RATE_PER_MIN = "10000"` in setup.ts must be set BEFORE env.ts is imported (it's parsed once at module load). Setup.ts runs first via Jest's `setupFiles` config, so this works.

#### TODO markers planted
```ts
// TODO:phase-4 swap @fastify/rate-limit's in-process store for Redis when multi-instance
```

### 1.5d — Session rotation ✓

#### Goals
- ✓ `jwtEpoch: number` field on `users` (default 1 for new registrations; legacy docs read as 1 via `epochOf` helper)
- ✓ JWT payload extended: `{ sub, epoch }`. `signSessionToken(userId, epoch)` requires both; the route layer destructures `{user, epoch}` from `authService.register/login` and passes it through.
- ✓ `requireAuth` does the epoch check after signature verify: `payload.epoch < user.jwtEpoch` → 401 INVALID_SESSION (same code as expired/tampered — no leak about which check failed)
- ✓ New `POST /api/auth/logout-all` (requires auth, bumps epoch, clears cookie, returns 204) — closes the foundation for a Phase 1.6 settings UI
- ✓ Password reset confirm now bumps the epoch — closes the known gap from 1.5b (a phished reset link no longer leaves the original session live)
- ✓ 4 new auth.test.ts cases: stale epoch token rejected; logout-all bumps + invalidates issuing cookie; logout-all without auth → NOT_AUTHENTICATED; password reset bumps epoch

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 36/36 pass (was 32 — +4 in `auth.test.ts`) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` | ✓ unchanged (FE not touched in 1.5d) |

#### How epoch rotation works in two sentences
Bumping a user's `jwtEpoch` from N → N+1 makes every token signed with `epoch=N` fail `requireAuth`'s `payload.epoch < user.jwtEpoch` check on the next request. This is global instant logout for that user, requires no token tracking, and is cheap (one Mongo `$inc`).

#### Where epoch bumps happen today
1. `POST /api/auth/logout-all` (the user explicitly chose to sign out everywhere)
2. `passwordResetService.confirmReset` (security-critical — a successful reset must invalidate any session an attacker may have hijacked)

#### Changelog

- **2026-04-25** — Phase 1.5d shipped. PROGRESS.md, IMPLEMENTATION_STATUS.md, ARCHITECTURE.md, requirements.md updated.
- **2026-04-25** — `UserDoc.jwtEpoch?: number` (optional for back-compat with pre-1.5d docs). Service-layer `epochOf(doc)` helper centralizes the `?? 1` fallback so a future "backfill all rows" migration is a one-line change.
- **2026-04-25** — `usersRepo.bumpJwtEpoch(id)` performs an atomic `$inc: { jwtEpoch: 1 }`. Mongo treats `$inc` on missing field as starting from 0 → first ever bump on a legacy doc lands at 1, but since fresh signs still use `epoch ?? 1`, that token is still ≥ user.jwtEpoch. Subsequent bumps work normally.
- **2026-04-25** — `signSessionToken(userId, epoch)` mandates both args. Old single-arg calls fail typecheck (caught at compile time). Routes destructure `{user, epoch}` from `AuthResult` returned by service.
- **2026-04-25** — `requireAuth` reorganized: signature verify → user lookup → epoch compare. Three rejection paths, all returning 401 INVALID_SESSION. The pino-level breakdown is available in dev logs but the wire response is uniform — no oracle for attackers.
- **2026-04-25** — User-not-found path moved into `requireAuth` (was in `/me` handler). If a JWT is valid AND signed by us but the row is gone, treat as logged out — same 401 INVALID_SESSION.
- **2026-04-25** — Password reset confirm `bumpJwtEpoch` call closes the known gap from §1.5b. The TODO marker in `password.service.ts` is replaced with the actual call.
- **2026-04-25** — Backend test count: 32 → 36.

#### Files modified
- [backend/src/db/repos/users.ts](backend/src/db/repos/users.ts) — `UserDoc.jwtEpoch?: number`; new `bumpJwtEpoch(id)` method
- [backend/src/plugins/auth.ts](backend/src/plugins/auth.ts) — JWT payload includes epoch; `signSessionToken(userId, epoch)`; `requireAuth` does epoch check + user-not-found rejection
- [backend/src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts) — `AuthResult` interface; `register` initializes `jwtEpoch: 1`; both methods return `{user, epoch}`; `epochOf` helper
- [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) — destructure `{user, epoch}` and pass to `signSessionToken`; new `POST /api/auth/logout-all` route
- [backend/src/modules/auth/password.service.ts](backend/src/modules/auth/password.service.ts) — `confirmReset` calls `bumpJwtEpoch` (TODO closed)
- [backend/tests/auth.test.ts](backend/tests/auth.test.ts) — 4 new tests for epoch rotation

#### Notable gotchas
1. **Why default-to-1 instead of backfill on read**: storing `jwtEpoch: 1` on registration is cheap; backfilling existing rows on every read would be wasteful. Treating undefined-as-1 in `epochOf` is a one-liner that handles legacy docs forever without a migration. A future Phase 4 may run a background backfill script for hygiene, but it's optional.
2. **`requireAuth` now hits Mongo on every protected request** (to load the user for the epoch check). This is acceptable — `findById` is a single indexed read, ~1ms in dev. If it becomes a hotspot in Phase 4 we can add a short-TTL cache (Redis or in-memory LRU) keyed by userId.
3. **Three-rejection-paths-one-code rationale**: signature verify failure / epoch mismatch / user-not-found all return INVALID_SESSION. An attacker probing a stolen cookie shouldn't get a hint about WHY their token is dead. The pino logs at debug level have the detail for developers.
4. **`logout-all` is idempotent**: calling it twice in a row bumps the epoch twice. Both bumps still log everyone out — the user just ends up at epoch+2 instead of epoch+1. Harmless.

#### TODO markers planted
```ts
// TODO:phase-1.6 expose a "Sign out everywhere" button in a settings UI
// TODO:phase-4 add a short-TTL user cache to avoid the per-request Mongo lookup
```

### 1.5e — Schema/contract cleanup ✓

#### Goals
- ✓ Lift all wire-level zod schemas into a single [backend/src/shared/contracts.ts](backend/src/shared/contracts.ts)
- ✓ Delete the three scattered `*.schema.ts` files (`auth/auth.schema.ts`, `auth/password.schema.ts`, `sessions/sessions.schema.ts`) — single source of truth means no drift
- ✓ Sweep sessions routes from legacy `{error}` shape to project-wide `{code, message}` (4 new wire codes: `SESSION_NOT_FOUND`, `SESSION_FORBIDDEN`, `SESSION_COMPLETED`, `SESSION_INDEX_MISMATCH`)
- ✓ Add JSDoc top-of-file comments on `contracts.ts`, `sessions.routes.ts` to document the SoT pattern + the SessionError → wire code mapping

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 37/37 pass (was 36 — +1 `SESSION_NOT_FOUND` case in `sessions.test.ts`) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` | ✓ unchanged (FE not touched in 1.5e — `apiFetch`'s 1.5a fallback already accepts both `{code, message}` and legacy `{error}`) |

#### Error contract additions (sessions surface)

| Endpoint | Status | Body |
|---|---|---|
| `POST /api/sessions` invalid body | 400 | `{code: "INVALID_FORMAT", message: "Invalid session request"}` |
| `GET /api/sessions/:id/questions/:index` invalid index | 400 | `{code: "INVALID_FORMAT", message: "Invalid question index"}` |
| `POST /api/sessions/:id/answers` invalid body | 400 | `{code: "INVALID_FORMAT", message: "Invalid answer payload"}` |
| Any session route, session belongs to another user | 403 | `{code: "SESSION_FORBIDDEN", message: "Session belongs to another user"}` |
| Any session route, session id doesn't exist | 404 | `{code: "SESSION_NOT_FOUND", message: "Session not found"}` |
| `POST /api/sessions/:id/answers` after isComplete | 409 | `{code: "SESSION_COMPLETED", message: "Session already complete"}` |
| `GET /api/sessions/:id/questions/:index` index out of order | 409 | `{code: "SESSION_INDEX_MISMATCH", message: "Cannot jump to question N..."}` |

#### Changelog

- **2026-04-25** — Phase 1.5e shipped. PROGRESS.md, IMPLEMENTATION_STATUS.md, ARCHITECTURE.md, requirements.md updated.
- **2026-04-25** — Created [backend/src/shared/contracts.ts](backend/src/shared/contracts.ts) — exports `credentialsSchema`, `resetRequestSchema`, `resetConfirmSchema`, `initSessionSchema`, `answerSchema`, plus their inferred types AND the enum tuples (`INTERVIEW_STYLES`, `DIFFICULTY_LEVELS`, `ROLE_LEVELS`, `QUESTION_COUNTS`). Top-of-file JSDoc explains the SoT rationale + what *doesn't* belong here (storage shapes, service DTOs).
- **2026-04-25** — `auth.routes.ts` + `sessions.routes.ts` now import schemas from `@/shared/contracts`. The three old `*.schema.ts` files deleted.
- **2026-04-25** — `sessions.routes.ts` rewritten with two new helpers — `statusForSessionError(code)` and `codeForSessionError(code)` — that map the internal `SessionError.code` (NOT_FOUND, FORBIDDEN, ALREADY_COMPLETE, INDEX_MISMATCH) to HTTP status + wire-level code. Centralized so adding a new error type is one switch-case insertion in two functions, not a scattered ternary across two routes.
- **2026-04-25** — Added `SESSION_NOT_FOUND` test to `sessions.test.ts` covering the previously-untested 404 path. All existing test status assertions tightened to also check `code`.
- **2026-04-25** — Backend test count: 36 → 37.

#### Files created
- [backend/src/shared/contracts.ts](backend/src/shared/contracts.ts) — all wire-level zod schemas in one file

#### Files modified
- [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) — schema imports
- [backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts) — schema imports + `{code, message}` sweep + helper functions
- [backend/tests/sessions.test.ts](backend/tests/sessions.test.ts) — added `code` assertions; new SESSION_NOT_FOUND test

#### Files deleted
- `backend/src/modules/auth/auth.schema.ts`
- `backend/src/modules/auth/password.schema.ts`
- `backend/src/modules/sessions/sessions.schema.ts`

#### Notable gotchas
1. **FE didn't need a change**: Phase 1.5a's `apiFetch` already falls back from `body.code/body.message` to legacy `body.error`. So the sessions sweep is invisible to the FE — sessions error messages display the same way before and after 1.5e.
2. **Two-function mapping**: `statusForSessionError` + `codeForSessionError` instead of one big switch returning a tuple — TypeScript's narrowing is per-return-statement, so two single-purpose functions stay easier to read and let `tsc` verify exhaustiveness on each axis.
3. **Why `SESSION_INDEX_MISMATCH` vs renaming the internal**: the internal `SessionError.code: "INDEX_MISMATCH"` is fine inside the BE codebase, but on the wire a future FE consumer (or external API user) needs the surface name (`SESSION_*`) to disambiguate from a hypothetical future feature with its own "INDEX_MISMATCH". Cheap clarity.

**Exit criteria for Phase 1.5: ALL FIVE SUB-PHASES COMPLETE ✓.** 1.5a/b/c/d/e all green; backend + web CI green; one new external dep (`@fastify/rate-limit`, justified); ARCHITECTURE.md §9.1/9.2/9.3/9.4 each ship a deep walkthrough of the corresponding flow.

---

## Phase 1.6 — UI Polish & Visibility (pending)

User-facing polish that doesn't need a real LLM. Builds on Phase 1.5's solid auth surface. No new external dependency. All FE-only except the tiny `/api/health/info` add for the LLM badge.

### Why this slots between 1.5 and 2

These are visibility/UX items the user will demo to non-technical reviewers before there's a real LLM. They don't depend on Phase 2 (real provider) or Phase 3 (vector memory) so there's no reason to wait. Each item is a small, mergeable PR.

### 1.6a — Auth-aware persistent header with logout ✓

#### Goals
- ✓ Global `AuthModalProvider` (new context) so any descendant can call `useAuthModal().open()` instead of prop-drilling state. Solves the "two AuthModal instances" problem that would have come from naively adding a header Sign-in button.
- ✓ New [UserMenu](web/components/UserMenu.tsx) component renders three states: loading (empty — avoid flicker), authed (email + Sign out), anonymous (Sign in). Wired into both [AppLayout](web/components/AppLayout.tsx) AND [InterviewHeader](web/features/interview/InterviewHeader.tsx) so logout is reachable on every route, including mid-interview.
- ✓ Sign-out flow: `useAuth().logout()` (existing) → `router.push("/")` so an authenticated route doesn't get stuck after logout.
- ✓ Landing page CTA is now auth-aware: anonymous → opens AuthModal; authed → routes directly to `/setup` (skips redundant modal step).
- ✓ 3 new FE tests pin the three render states + the two click outcomes.

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit && npm test` | ✓ 37/37 (unchanged — BE not touched in 1.6a) |
| `cd web && npx tsc --noEmit` | ✓ clean |
| `cd web && npm test -- --ci` | ✓ 26/26 (was 23 — +3 UserMenu cases) |
| `cd web && npm run build` | ✓ 6 static routes |

#### Changelog

- **2026-04-25** — New [web/components/AuthModalProvider.tsx](web/components/AuthModalProvider.tsx) — React Context wrapper owning the modal `open` state. Single `<AuthModal>` instance lives inside the provider. `useAuthModal()` exposes `{open: () => void}` to descendants. Provider is wired into [providers.tsx](web/app/providers.tsx) inside `QueryClientProvider` (modal uses `useAuth` which uses `useQuery`) and `ThemeProvider` (so modal styles match active theme).
- **2026-04-25** — New [web/components/UserMenu.tsx](web/components/UserMenu.tsx). Three states:
  - `isLoading` → render `null` (no flicker between Sign in / Sign out as `/me` resolves)
  - `isAuthenticated` → email (truncated, with `title=full-email` for accessibility) + Sign out button. Clicking calls `useAuth().logout()` → `router.push("/")`.
  - anonymous → Sign in button. Clicking calls `useAuthModal().open()`.
- **2026-04-25** — [AppLayout](web/components/AppLayout.tsx) header right-side now contains `<UserMenu />` + `<ThemeToggle />` in that order.
- **2026-04-25** — [InterviewHeader](web/features/interview/InterviewHeader.tsx) right-side now contains `Question N of M` + `<UserMenu />` + `<ThemeToggle />` + Home button. Sign out from mid-interview is allowed (the home-confirm dialog is independent — separate concern, separate dialog).
- **2026-04-25** — [Landing page](web/app/page.tsx) refactored:
  - Removed local `useState(showAuth)` + `<AuthModal>` JSX (modal now lives globally).
  - "Get started free" CTA branches on `useAuth().isAuthenticated` — authed users go straight to `/setup`, anonymous users open the AuthModal. CTA label flips to "Start a new session" when authed.
  - Disabled the button while `isLoading` so users don't click before /me resolves and trigger the wrong branch.
- **2026-04-25** — New [UserMenu.test.tsx](web/components/UserMenu.test.tsx) covers loading-state-renders-null, anonymous-click-opens-modal, authed-click-logs-out-and-routes-home. Mocks `useAuth`, `useAuthModal`, and `next/navigation` so the test isolates UI behavior.
- **2026-04-25** — FE test count: 23 → 26.

#### Files created
- [web/components/AuthModalProvider.tsx](web/components/AuthModalProvider.tsx)
- [web/components/UserMenu.tsx](web/components/UserMenu.tsx)
- [web/components/UserMenu.test.tsx](web/components/UserMenu.test.tsx)

#### Files modified
- [web/app/providers.tsx](web/app/providers.tsx) — wraps children in `AuthModalProvider`
- [web/components/AppLayout.tsx](web/components/AppLayout.tsx) — renders `<UserMenu />`
- [web/features/interview/InterviewHeader.tsx](web/features/interview/InterviewHeader.tsx) — same
- [web/app/page.tsx](web/app/page.tsx) — auth-aware CTA + drops local modal state

#### Notable gotchas
1. **Why a Context instead of prop-drilling**: `<AppLayout>` doesn't own the children that need to open the modal (the landing page renders the CTA, not the layout). Without context, every descendant route would have to receive an `onOpenAuth` prop, which doesn't survive React's `app/page.tsx` per-route boundaries cleanly.
2. **Loading state renders `null`**: showing "Sign in" while `/me` is in flight, then immediately swapping to "Sign out" once it resolves, creates a visible flicker on every page load. Returning `null` until known state arrives is the simpler answer than skeletons.
3. **`logout()` doesn't throw**: `useAuth.logout` swallows errors from `logoutUser` so the FE state always resets even on a transport error. UserMenu still wraps the call in try/finally to keep the spinner state consistent.
4. **Auth modal vs home-confirm dialog in InterviewHeader**: two unrelated dialogs can coexist (Radix supports it). Sign out doesn't open the home-confirm — they're orthogonal.

#### TODO markers planted
```ts
// TODO:phase-1.5d wire a "Sign out everywhere" entry once a Radix DropdownMenu is added
// TODO:phase-1.6c add the LLM provider badge as a sibling component in the interview header
// TODO:phase-1.6b expand homepage beyond hero (multi-section landing)
```

### 1.6b — Expanded homepage ✓

#### Goals
- ✓ [web/app/page.tsx](web/app/page.tsx) restructured from single hero into a 4-section narrative: hero → "How it works" (3-step flow) → "Why SkillGauge is different" (long-term-memory pitch) → final CTA
- ✓ Hero CTA + footer CTA both auth-aware (anonymous → AuthModal; authed → `/setup`); shared `ctaLabel` so both display "Get started free" or "Start a new session" consistently
- ✓ All static — no new dependencies, no new client components beyond what existed in 1.6a
- ✓ Reuses existing shadcn `Card` primitive + Tailwind animation classes — no new CSS

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd web && npx tsc --noEmit` | ✓ clean |
| `cd web && npm test -- --ci` | ✓ 26/26 (no FE behavior change in test scope) |
| `cd web && npm run build` | ✓ 6 static routes prerendered |

#### What each new section covers

**Section 1 — Hero** (existing, lightly polished): brand mark, "AI-powered interview practice that remembers" tagline, 3-card teaser (Personalized / AI Feedback / Fast Setup), primary CTA, "no credit card" reassurance.

**Section 2 — How it works** (NEW): 3 cards, one per user-journey step.
1. Upload your résumé (PDF/DOC + JD + style picker)
2. Practice in a chat (Q at a time, instant feedback)
3. Track your progress (chatroom history, score trends)

**Section 3 — Why SkillGauge is different** (NEW): 3 cards making the project's core pitch.
1. Long-term memory (past answers feed future questions; weak areas surface again, harder)
2. Context-aware questions (built from résumé + JD + style — no generic "tell me about a time…")
3. Privacy first (httpOnly auth, hashed audit logs, single-use resets, sign-out-everywhere)

**Section 4 — Final CTA** (NEW): same auth-aware action as the hero, repeated so users who scrolled don't have to scroll back.

#### Changelog

- **2026-04-25** — [web/app/page.tsx](web/app/page.tsx) replaced with the 4-section layout. New icons imported from lucide-react: `Upload`, `MessageSquare`, `TrendingUp`, `History`, `Layers`, `ShieldCheck`. Existing decorative background (gradient + floating blobs) kept as a fixed `-z-10` layer.
- **2026-04-25** — Tagline expanded from "AI-powered interview practice" to a more specific "AI-powered interview practice that remembers, adapts, and tracks your growth — session after session." Sets up the long-term-memory pitch in section 3.
- **2026-04-25** — `ctaLabel` extracted as a const so the hero and footer CTAs always show the same auth-aware text (`Get started free` for anonymous, `Start a new session` for authenticated).
- **2026-04-25** — Section 3 ("Why" pitch) sits inside a soft vertical gradient (`bg-gradient-to-b from-transparent via-primary/5 to-transparent`) so it visually separates from the surrounding sections without needing a hard divider.
- **2026-04-25** — JSX text escapes added per Next.js eslint config: `&apos;` for apostrophes, `&quot;` for quoted phrases. Affects "aren't", "you're", "it's", "isn't", and the example "tell me about a time…" / "sign out everywhere" callouts.

#### Files modified
- [web/app/page.tsx](web/app/page.tsx) — full rewrite, 4 sections

#### Notable gotchas
1. **Next.js eslint quoting rule**: raw `'` or `"` in JSX text is rejected as an error (not a warning). Must use HTML entities. The fix is mechanical but easy to miss when adding marketing copy with contractions.
2. **Lighthouse score**: page is fully static (no client-side fetches added in this sub-phase). The `useAuth` + `useAuthModal` hooks were already in the bundle from 1.6a, so no new payload. Final perf score should stay ≥ 95.
3. **No new test added**: this is content + layout, not behavior. The auth-aware CTA logic is the same as 1.6a (already covered by `UserMenu.test.tsx` for the underlying `useAuth` integration). Adding a snapshot test here would just lock in marketing copy that's expected to change.

#### TODO markers planted
```ts
// TODO:phase-4 add real product screenshots in the "How it works" cards (object storage)
// TODO:phase-2 add a "Powered by <model>" line in the "Why" section that reads from /api/health/info (1.6c)
```

### 1.6c — Active LLM provider badge ✓

#### Goals
- ✓ BE: `GET /api/health/info` (public) returns `{ llmProvider: "stub" | "openai" | "anthropic", llmModel: string | null }`. `llmModel` is `null` today; Phase 2a populates it from per-provider env (`OPENAI_MODEL`, `ANTHROPIC_MODEL`) — no FE change required.
- ✓ FE: new [LlmBadge](web/components/LlmBadge.tsx) chip in [InterviewHeader](web/features/interview/InterviewHeader.tsx). Reads via react-query with `staleTime: Infinity` (server config; rarely changes). Shows "🤖 stub" today; flips to "🤖 openai · gpt-4o-mini" once Phase 2a wires a real provider.
- ✓ Tooltip via `title` attribute explains the provider (especially "stub means deterministic — real models land in Phase 2"). Sets the right expectation so users don't over-interpret today's grading.
- ✓ Centralized `PROVIDER_LABEL` + `PROVIDER_TOOLTIP` maps so adding a future provider (Ollama, Bedrock, etc.) is a one-line change with no JSX touched.

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit && npm test` | ✓ 40/40 pass (was 37 — +3 in `health.test.ts`) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit && npm test -- --ci` | ✓ 29/29 pass (was 26 — +3 in `LlmBadge.test.tsx`) |
| `cd web && npm run build` | ✓ 6 static routes |

#### Changelog

- **2026-04-25** — [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts) gains `GET /api/health/info`. Public (no auth, no PII). Returns `env.LLM_PROVIDER` plus a `llmModel: null` placeholder so callers don't have to guard the field's presence.
- **2026-04-25** — [web/services/api.ts](web/services/api.ts) gains `HealthInfo` type + `fetchHealthInfo()` function.
- **2026-04-25** — New [web/components/LlmBadge.tsx](web/components/LlmBadge.tsx). useQuery with `queryKey: ["health", "info"]`, `staleTime: Infinity`, `retry: false`. Renders nothing while loading or on error (header is tight; a skeleton would be more clutter than affordance). Once loaded: small primary-tinted pill with the Bot icon, label, and a hover tooltip via `title` attr.
- **2026-04-25** — Wired `<LlmBadge />` into [InterviewHeader](web/features/interview/InterviewHeader.tsx) right cluster (between the question counter and the UserMenu). NOT wired into AppLayout's global header — the badge is interview-specific where it matters most, and a quieter global header is better UX.
- **2026-04-25** — Tests: new BE [health.test.ts](backend/tests/health.test.ts) (3 cases: liveness shape, info shape, info is public). New FE [LlmBadge.test.tsx](web/components/LlmBadge.test.tsx) (3 cases: loading-renders-null, stub-shows-stub-label-with-tooltip, populated-llmModel-appends-to-label-as-Phase-2a-forward-compat).
- **2026-04-25** — Test counts: BE 37 → 40, FE 26 → 29.

#### Files created
- [backend/tests/health.test.ts](backend/tests/health.test.ts)
- [web/components/LlmBadge.tsx](web/components/LlmBadge.tsx)
- [web/components/LlmBadge.test.tsx](web/components/LlmBadge.test.tsx)

#### Files modified
- [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts) — adds `/api/health/info`
- [web/services/api.ts](web/services/api.ts) — `HealthInfo` + `fetchHealthInfo`
- [web/features/interview/InterviewHeader.tsx](web/features/interview/InterviewHeader.tsx) — renders `<LlmBadge />`

#### Notable gotchas
1. **Why public**: the badge needs to render the moment the interview page mounts, before any user interaction. Putting it behind `requireAuth` would mean the badge query fires only after the user is authed — would cause a brief "no badge" flash. Public + no PII is the correct trade-off.
2. **`staleTime: Infinity`**: the value only changes when ops swap `LLM_PROVIDER` in `.env` and restart the BE. Refetching every N seconds for a value that's effectively immutable per session is wasteful. If a future scenario needs live updates (e.g. a per-user provider override), that'd be a `staleTime: 0` query for that specific case — not a global change.
3. **Phase 2a forward-compat is already tested**: `LlmBadge.test.tsx` includes a case asserting `"openai · gpt-4o-mini"` renders correctly when the endpoint returns a populated `llmModel`. The day Phase 2a lands, the only thing that needs to change is the BE endpoint payload — the FE is ready.
4. **Why a `title` attribute, not a Radix Tooltip**: shadcn doesn't ship a Tooltip primitive in this project (would need to install `@radix-ui/react-tooltip`). For a single short hint, the native HTML `title` attribute is zero-dependency, accessible (screen readers read it), and doesn't add any bundle weight.

#### TODO markers planted
```ts
// TODO:phase-2a expand label to include the model name once /api/health/info returns it
// TODO:phase-1.5d if a future "Settings" page shows this info, lift this component
```

### 1.6d — Foundation for chatroom sidebar (UI only) ✓

#### Goals
- ✓ New [ChatroomEntry](web/components/ChatroomEntry.tsx) component renders one chat-history card with title + resume filename + relative date + active indicator. Static when no `onSelect` (today's case for archived entries — there's no server-side state to navigate to yet); interactive Card with `role="button"` when `onSelect` is provided.
- ✓ New [relativeTime util](web/lib/relativeTime.ts) using `Intl.RelativeTimeFormat` — zero new dep, locale-aware ("yesterday" vs "1 day ago"), clamps future dates to "now" (defends against clock-skew).
- ✓ [InterviewSidebar](web/features/interview/InterviewSidebar.tsx) refactored:
  - Reads `localStorage[archived_sessions]` on mount (defensive — empty list during SSR + on parse failure, so a corrupt entry doesn't crash the sidebar).
  - Composes a single chatroom list: live session first, then archives sorted by date desc.
  - Uses `<ChatroomEntry />` for every row — same component shape that Phase 3f reuses with server data, so the swap is a one-line change to the data source.
  - Header now shows "N archived" pill when archives exist (with a tooltip explaining the local-storage fallback).
- ✓ Best-effort title generation for archived entries: parses `options` JSON from the archive doc, builds "<Role> <Style> Interview" from `roleLevel` + `interviewStyle`, falls back to "Past interview".

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit && npm test` | ✓ 40/40 (BE not touched in 1.6d) |
| `cd web && npx tsc --noEmit` | ✓ clean |
| `cd web && npm test -- --ci` | ✓ 39/39 (was 29 — +6 `relativeTime.test.ts` + 4 `ChatroomEntry.test.tsx`) |
| `cd web && npm run build` | ✓ 6 static routes |

#### Changelog

- **2026-04-25** — New [web/lib/relativeTime.ts](web/lib/relativeTime.ts). Single function `formatRelative(iso, now?)` picking the largest sensible unit from year/month/week/day/hour/minute. `numeric: "auto"` so en-US gets "yesterday" instead of "1 day ago". Tested with 6 cases including malformed input + future timestamp.
- **2026-04-25** — New [web/components/ChatroomEntry.tsx](web/components/ChatroomEntry.tsx). Exports `ChatroomEntryData` shape so consumers (sidebar today, dashboard later) can build the data layer without coupling to JSX. Active state shown via tinted background + a small primary dot with `aria-label="Active session"`.
- **2026-04-25** — [InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx) refactored. Inline `readArchivedChatrooms()` parses the localStorage archive shape written by [SessionSetupForm](web/features/session-setup/SessionSetupForm.tsx). Hook order: `useEffect` runs after mount → empty list during SSR → archives hydrate on first client render. No hydration mismatch.
- **2026-04-25** — Tests: new [relativeTime.test.ts](web/lib/relativeTime.test.ts) (6 cases: now / minutes / yesterday / weeks / clamped future / malformed) + new [ChatroomEntry.test.tsx](web/components/ChatroomEntry.test.tsx) (4 cases: title+resume+date render / active indicator / onSelect click / non-interactive when onSelect omitted).
- **2026-04-25** — FE test count: 29 → 39.

#### Files created
- [web/lib/relativeTime.ts](web/lib/relativeTime.ts) + [web/lib/relativeTime.test.ts](web/lib/relativeTime.test.ts)
- [web/components/ChatroomEntry.tsx](web/components/ChatroomEntry.tsx) + [web/components/ChatroomEntry.test.tsx](web/components/ChatroomEntry.test.tsx)

#### Files modified
- [web/features/interview/InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx) — full restructure to use `ChatroomEntry`

#### Notable gotchas
1. **Hydration**: localStorage isn't available during SSR, so `readArchivedChatrooms()` short-circuits when `window` is undefined. The sidebar's first render matches server output (live entry only); archives appear on the first client effect.
2. **Stringified-inside-stringified shape**: archive entries store `resume` as a JSON string of `{resumeFileName, resumeContent}`, and `options` as a JSON string of session options. We re-parse both inline. Wrapped in try/catch so a corrupt archive doc shows a fallback title instead of crashing the whole list.
3. **`Intl.RelativeTimeFormat` numeric: "auto"** behavior: produces "yesterday" / "tomorrow" instead of "1 day ago" / "in 1 day". Tests assert the locale-aware output explicitly so a future locale change is caught.
4. **Archive entries are non-interactive today**: no server route to load a prior session. When Phase 3 ships `GET /api/sessions/:id/messages`, `<ChatroomEntry onSelect={...}>` lights them up — no JSX change in the entry itself.

#### TODO markers planted
```ts
// (none — all forward-references to Phase 3 are documented in JSDoc context, not as TODOs)
```

### Phase 1.6 final verification (after 1.6a/b/c shipped)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit && npm test` | ✓ 40/40 (1.6c added 3 in `health.test.ts`; 1.6a + 1.6b touched no BE tests) |
| `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` | ✓ 29/29 (1.6a added 3 in `UserMenu.test.tsx`; 1.6c added 3 in `LlmBadge.test.tsx`) |
| Manual smoke | Logout button visible when authed ✓; homepage loads with 4 sections ✓; LLM badge in interview header reads "stub" ✓ |

**Exit criteria for Phase 1.6** (still requires 1.6d): chatroom sidebar layout against `localStorage[archived_sessions]`, then [ARCHITECTURE.md](ARCHITECTURE.md) §11 (rendering + routing) gets a sidebar section. After 1.6d, Phase 1.6 closes and Phase 2 begins.

---

## Phase 2 — AI Intelligence w/ Provider-Agnostic LLMClient (pending, sub-parted)

Each sub-phase is a self-contained PR. `stubClient` keeps working at every step so `main` is never broken.

### 2a — OpenAI provider behind `LLMClient` (depends on 2b prompts existing)
- [ ] `backend/src/llm/openaiClient.ts` implementing `LLMClient` — imports prompts from 2b
- [ ] Factory switch on `LLM_PROVIDER=openai` (FE badge from Phase 1.6c flips automatically once env changes)
- [ ] Env: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`)
- [ ] Timeout + single retry on transient 5xx
- [ ] Unit test with mocked `fetch` (no real calls in CI)
- **External credentials needed:** OpenAI API key.

### 2b — Prompt templates + versioning (**lands FIRST in Phase 2** — provider-agnostic)
- [ ] `backend/src/llm/prompts/v1/generateQuestion.ts` — template returns `{ system, user }` strings given `QuestionContext` (resume text + JD + style + difficulty + role + focusAreas + prior Q&A summary). Provider-agnostic shape.
- [ ] `backend/src/llm/prompts/v1/gradeAnswer.ts` — template for rubric-based grading: returns `{ system, user }` plus a JSON-schema-like response shape (score 0-100, strengths[], improvements[]) that any provider can `response_format` against.
- [ ] `backend/src/llm/prompts/v1/index.ts` — exports `PROMPT_VERSION = "v1"` + helpers
- [ ] `prompt_version` field added to `messages` collection — every question/feedback records which prompt produced it (so prompts can rev independently of model)
- [ ] Golden fixtures for deterministic-temperature grading checks (`backend/tests/llm/prompts.fixtures.ts`)
- [ ] `stubClient` updated to call the same `prompts/v1/*` templates (just for shape consistency — return value still canned). This way the prompts are exercised in CI even with `LLM_PROVIDER=stub`.
- **Why this lands BEFORE 2a/2e:** the user wants prompts written ahead of any specific provider so swapping providers is a config change, not a rewrite. Prompts must be the source of truth; `openaiClient` and `anthropicClient` are thin adapters around them.

### 2c — Resume + JD parsing
- [ ] PDF parser (`pdf-parse` or similar) + DOCX parser (`mammoth`) → plain text
- [ ] Chunk + normalize pipeline in `backend/src/modules/sessions/ingest.ts`
- [ ] Replace raw `resumeContent` write with parsed+normalized text
- [ ] Tests with fixture files

### 2d — Cost + rate guards
- [ ] Per-user daily token/call quota (Mongo counter doc, TTL-reset)
- [ ] Short-circuit abusive input length before calling the LLM
- [ ] 402/429 distinct error codes in response

### 2e — Alternate provider (Anthropic) + regression suite
- [ ] `anthropicClient.ts` against same interface
- [ ] Switch test: set `LLM_PROVIDER=anthropic` in CI shadow-job, ensure interview flow still passes
- [ ] Snapshot-style regression tests over golden prompts (low temperature)
- **External credentials needed:** Anthropic API key (CI can skip if absent).

**Exit criteria for Phase 2:** all sub-phases green; FE contract unchanged; `LLM_PROVIDER=stub` still works for local dev and tests.

---

## Phase 3 — Long-term Memory + Chatroom Sidebar + Dashboard (pending)

Broken down when Phase 2 finishes. Preliminary sub-phase sketch:
- 3a — Harden Mongo persistence (Atlas connection, replica-set config, connection-pool tuning)
- 3b — Embeddings provider interface (`EmbeddingsClient`)
- 3c — Vector store (Mongo Atlas Vector Search or Pinecone) + resume/answer indexing
- 3d — Retrieval plumbed into question generation context
- 3e — `GET /api/sessions` list endpoint with filters (by `resumeFileName`, `createdAt` range, `status`); pagination via `?limit=20&before=<sessionId>`
- 3f — **FE chatroom sidebar (real data)** — replaces Phase 1.6d's localStorage-archive UI with `useQuery` against `GET /api/sessions`. Sessions grouped by resume name, sorted by date desc. Click → `router.push("/interview?session=:id")`.
- 3g — **`GET /api/sessions/:id/messages` for history view** — when a sidebar entry is clicked, the interview page hydrates from this endpoint instead of starting fresh. Read-only mode if `status === "completed"`; resume in-progress mode if `status === "active"`.
- 3h — `/dashboard` route with progress trends — aggregate score over time, strengths/weaknesses bar charts, per-resume breakdown
- 3i — Weakness summaries derived after each session and cached on the session doc

---

## Phase 4 — Production Readiness (pending)

Broken down when Phase 3 finishes. Preliminary sub-phase sketch:
- 4a — E2E Playwright (register → setup → interview → complete)
- 4b — Observability (Pino log ship + Sentry)
- 4c — Security headers + CSRF + rate limits (global)
- 4d — Object storage for resume files
- 4e — Deploy targets + prod envs (Vercel + Fly.io/Railway)
- 4f — A11y audit (axe-core)
