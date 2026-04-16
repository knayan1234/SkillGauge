# SkillGauge Implementation Status

## Purpose

This document separates:

- what is already built
- what is partially built
- what still needs to be built
- how the project is currently organized
- how the full project should be organized when the backend is added

This is based on the current tracked code in the repository.

---

## Current Repo Reality

- The repository currently contains a working frontend prototype in `skillgauge/`.
- There is no standalone backend service in the repo yet.
- The frontend already has the main interview flow screens and local state handling.
- Backend behavior is currently mocked inside `skillgauge/app/services/api.ts`.
- The product vision in `README.md` describes a larger AI system than what is currently implemented.

---

## Current Project Folder Structure

```text
SkillGauge/
|-- .github/
|   |-- workflows/
|   |   `-- ci.yml
|   `-- copilot-instructions.md
|-- LICENSE
|-- README.md
|-- IMPLEMENTATION_STATUS.md
`-- skillgauge/
    |-- app/
    |   |-- components/
    |   |   `-- ui/
    |   |-- features/
    |   |   |-- auth/
    |   |   |-- interview/
    |   |   `-- session-setup/
    |   |-- hooks/
    |   |-- layouts/
    |   |-- lib/
    |   |-- routes/
    |   |-- services/
    |   `-- styles/
    |-- public/
    |-- .dockerignore
    |-- .gitignore
    |-- components.json
    |-- Dockerfile
    |-- eslint.config.ts
    |-- package-lock.json
    |-- package.json
    |-- react-router.config.ts
    |-- README.md
    |-- tsconfig.json
    `-- vite.config.ts
```

### Ignored/Generated folders present locally

These are present in the working tree but are not tracked as source-of-truth implementation folders:

- `skillgauge/.react-router/`
- `skillgauge/build/`
- `skillgauge/node_modules/`
- `skillgauge/internal_cookbook/`

---

## What Is Already Made On The Frontend

| Area | Status | What exists now |
|---|---|---|
| App shell and routing | Done | React Router app with `/`, `/setup`, `/interview`, and fallback 404 routes. |
| Global layout and styling | Done | Root shell, app layout, interview layout, Tailwind styling, theme tokens, branding assets. |
| Landing page | Done | Branded landing page with CTA, feature cards, and auth modal entry point. |
| Auth UI | Partial | Login/register modal exists and works against mocked auth functions. |
| Protected route behavior | Partial | Setup and interview pages redirect unauthenticated users back to landing. |
| Session setup UI | Partial | Resume picker and job description input exist; they do not upload to a backend yet. |
| Interview chat UI | Partial | Question, answer, feedback, loading, completion, and sidebar UI exist. |
| Evaluation UI | Partial | Score, strengths, and improvement sections are rendered from mock feedback data. |
| Local session state | Partial | `useSession` manages current interview state in memory. |
| Local auth state | Partial | `useAuth` stores token and user in `localStorage`. |
| Build/deploy basics | Partial | Vite, SSR config, Dockerfile, and CI workflow exist. |

### Frontend modules already implemented

- `skillgauge/app/root.tsx`
  - Root HTML shell, metadata, links, error boundary.
- `skillgauge/app/routes.ts`
  - Route registration.
- `skillgauge/app/routes/landing.tsx`
  - Product landing page.
- `skillgauge/app/routes/setup.tsx`
  - Protected session setup page.
- `skillgauge/app/routes/interview.tsx`
  - Protected interview page.
- `skillgauge/app/routes/notfound.tsx`
  - 404 page.
- `skillgauge/app/features/auth/AuthModal.tsx`
  - Login/register dialog UI.
- `skillgauge/app/features/session-setup/SessionSetupForm.tsx`
  - Resume and job description form.
- `skillgauge/app/features/interview/*`
  - Interview-specific UI pieces.
- `skillgauge/app/hooks/useAuth.ts`
  - Local auth state wrapper.
- `skillgauge/app/hooks/useSession.ts`
  - Local interview session state wrapper.
- `skillgauge/app/services/api.ts`
  - Mock API types and fake async functions.

### Frontend flow that currently works

```text
Landing page
-> Auth modal
-> Mock login/register
-> Setup page
-> Resume file picked locally + JD stored in sessionStorage
-> Interview page
-> Mock session initialization
-> Hardcoded question flow
-> Mock feedback and score rendering
```

---

## What Still Needs To Be Made On The Frontend

| Area | Priority | What still needs to be built |
|---|---|---|
| Real API integration | High | Replace mock functions in `app/services/api.ts` with actual backend calls. |
| Resume upload flow | High | Upload file to backend, track upload state, validate file type/size, handle backend parsing response. |
| Job description processing | High | Send JD to backend, show processing status, handle failures and retries. |
| Real auth flow | High | Connect login/register/logout to backend auth and token validation. |
| Persistent session history | High | Replace placeholder sidebar history with real session history from backend. |
| Interview session restore | High | Restore active session from backend instead of browser-only storage. |
| Better error states | Medium | User-visible error messages, retry actions, empty states, and network failure handling. |
| Form validation | Medium | Resume input validation, JD validation, and input constraints. |
| Dashboard/progress view | Medium | Progress tracking page for trends, previous sessions, and weaknesses. |
| Loading UX polish | Medium | More granular loaders for upload, question generation, evaluation, and history fetch. |
| Testing | Medium | Unit tests for hooks/components and end-to-end flow tests. |
| Accessibility pass | Medium | Keyboard navigation, focus management, aria labels, screen-reader checks. |
| Analytics hooks | Low | Frontend instrumentation for user actions and flow drop-off. |

---

## What Is Already Made On The Backend Side

There is no real backend service in the repository yet.

### Backend-like work that already exists

These pieces exist only as placeholders inside the frontend:

| Area | Status | What exists now |
|---|---|---|
| API contract sketch | Partial | `User`, `Session`, `Message`, and `SessionInitRequest` types exist in `skillgauge/app/services/api.ts`. |
| Auth behavior | Mocked | Fake login/register returns a demo user and generated token. |
| Session creation | Mocked | Fake session object is returned after a timeout. |
| Question generation | Mocked | Questions come from a hardcoded array. |
| Answer evaluation | Mocked | Score is derived from answer length, with fixed strengths/improvements. |
| Persistence | Mocked/local only | Browser `localStorage` and `sessionStorage` are used instead of databases. |

---

## What Still Needs To Be Made On The Backend

| Area | Priority | What needs to be built |
|---|---|---|
| Backend service scaffold | High | Create a real Node.js/TypeScript backend service in a new `backend/` folder. |
| Auth service | High | User registration, login, token issuing, token validation, logout/session invalidation. |
| Resume ingestion | High | File upload endpoint, text extraction, parsing, storage, and validation. |
| Job description ingestion | High | Endpoint for JD submission, normalization, chunking, and persistence. |
| Interview session service | High | Create session, fetch active session, list user sessions, resume sessions. |
| Question generation service | High | Generate first and follow-up questions using resume + JD + past context. |
| Answer evaluation service | High | Evaluate answers using an LLM and return structured feedback. |
| Database persistence | High | Store users, sessions, questions, answers, scores, and summaries. |
| Vector memory layer | High | Store and retrieve resume chunks, JD chunks, previous answers, and weaknesses. |
| Progress analytics | Medium | Aggregate scores across sessions and expose dashboard data. |
| Prompt/version management | Medium | Centralize prompts, schemas, and versioning for AI behavior. |
| Background jobs | Medium | Async parsing/indexing/evaluation tasks if needed for scale. |
| Observability | Medium | Logging, tracing, error reporting, and request metrics. |
| Test coverage | Medium | Unit, integration, and contract tests for backend modules. |
| Deployment config | Medium | Backend Dockerfile, environment templates, and production deployment setup. |

---

## Recommended Full Project Folder Structure

The current frontend can stay in `skillgauge/`. The backend should be added beside it.

```text
SkillGauge/
|-- .github/
|-- LICENSE
|-- README.md
|-- IMPLEMENTATION_STATUS.md
|-- skillgauge/                  # existing frontend app
|   |-- app/
|   |-- public/
|   |-- package.json
|   |-- tsconfig.json
|   |-- vite.config.ts
|   `-- Dockerfile
|-- backend/                     # new backend service
|   |-- src/
|   |   |-- config/
|   |   |-- modules/
|   |   |   |-- auth/
|   |   |   |-- resume/
|   |   |   |-- job-description/
|   |   |   |-- interview/
|   |   |   |-- evaluation/
|   |   |   |-- memory/
|   |   |   `-- analytics/
|   |   |-- db/
|   |   |-- vector/
|   |   |-- prompts/
|   |   |-- shared/
|   |   `-- index.ts
|   |-- package.json
|   |-- tsconfig.json
|   |-- Dockerfile
|   `-- .env.example
`-- shared/                      # optional but recommended
    |-- types/
    `-- constants/
```

### Suggested responsibility split

#### Frontend (`skillgauge/`)

- routing
- page composition
- UI components
- form handling
- loading/error states
- authenticated flow orchestration
- rendering questions, answers, scores, history, and progress

#### Backend (`backend/`)

- auth and user identity
- resume ingestion and parsing
- job description ingestion
- vector indexing and retrieval
- interview session creation and lifecycle
- question generation
- answer evaluation
- long-term memory updates
- analytics and progress aggregation

#### Shared (`shared/`)

- shared TypeScript types
- API request/response contracts
- enums, constants, and validation schemas shared across FE and BE

---

## Suggested Build Order

### Phase 1: Connect the existing frontend to a real backend

1. Create `backend/` service scaffold.
2. Define shared request/response contracts.
3. Replace mock auth with real auth endpoints.
4. Replace browser-only session creation with backend session creation.
5. Add resume upload and JD submission endpoints.
6. Return real session IDs and fetch real interview history.

### Phase 2: Implement the real interview intelligence

1. Parse resume and JD content.
2. Store data in a primary database.
3. Add embeddings and vector retrieval.
4. Generate real interview questions.
5. Evaluate answers with structured AI feedback.

### Phase 3: Add long-term progress features

1. Store session results and weakness summaries.
2. Build progress dashboard endpoints.
3. Add frontend progress screens.
4. Surface trends across sessions.

---

## Final Summary

- Frontend status: prototype is built and usable as a local demo.
- Backend status: not built yet as a real service.
- Current repo status: frontend-first implementation with mocked business logic.
- Next major milestone: add a real backend and replace `app/services/api.ts` mocks with real API calls.

