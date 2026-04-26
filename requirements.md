# SkillGauge — Operational Requirements

**Scope:** what you need to install, configure, and run to keep the **backend** (and FE talking to it) stand up locally and in CI. Keep this file in lockstep with [backend/.env.example](backend/.env.example) and [backend/package.json](backend/package.json).

**Last updated:** 2026-04-26 (Phase 2 fully complete; BE migrated Fastify 5 → Express 5 on 2026-04-26 with no functional change.)

---

## 1. One-time machine setup

| Requirement | Version | Why |
|---|---|---|
| Node.js | ≥ 20 (LTS 22 recommended) | Express 5 + Next 16 baseline |
| npm | ships with Node | lockfiles are npm |
| Git | any recent | required by CI and most tools |
| MongoDB | 7.x | persistence layer; one of the three options below |
| Docker (optional) | any | easiest way to run Mongo locally |

Pick **one** Mongo source:

- **Docker (recommended for dev):** `docker run -d --name skillgauge-mongo -p 27017:27017 -v skillgauge-mongo:/data/db mongo:7`
- **MongoDB Atlas free tier (M0):** create a cluster, allow your IP, grab the SRV URI.
- **Native install:** `brew install mongodb-community@7` on macOS, or the official MSI on Windows.

No MongoDB is required for `npm test` — the backend tests spin up an in-memory `mongodb-memory-server` per suite. First run downloads ~60 MB of mongod binaries.

---

## 2. First-time backend bring-up

```bash
cd backend
cp .env.example .env        # then edit JWT_SECRET + MONGODB_URI
npm install
npm run migrate             # idempotent: creates indexes
npm run dev                 # tsx watch on :4000
```

Expected:
- Server logs `Server listening on http://127.0.0.1:4000`
- `curl http://127.0.0.1:4000/api/health` → `{"status":"ok"}`

---

## 3. Environment variables (`backend/.env`)

All validated by zod in [backend/src/config/env.ts](backend/src/config/env.ts). Fatal on boot if invalid in production.

| Var | Required | Default (dev) | Notes |
|---|---|---|---|
| `PORT` | no | `4000` | bind port |
| `HOST` | no | `127.0.0.1` | use `0.0.0.0` in Docker |
| `CORS_ORIGIN` | **yes** | `http://localhost:3000` | comma-separated; must NOT be `*` when cookies are used |
| `JWT_SECRET` | **yes** | dev fallback only | generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `MONGODB_URI` | **yes** | `mongodb://127.0.0.1:27017` | SRV URI for Atlas |
| `MONGODB_DB` | **yes** | `skillgauge` | isolated DB per env (`skillgauge_dev`, `skillgauge_test`, `skillgauge_prod`) |
| `LLM_PROVIDER` | **yes** | `stub` | `stub` \| `openai` \| `anthropic` \| `gemini` |
| `OPENAI_API_KEY` | Required if `LLM_PROVIDER=openai` | placeholder in `.env.example` | Get a key at https://platform.openai.com/api-keys |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | Override to `gpt-4o` for higher quality |
| `ANTHROPIC_API_KEY` | Required if `LLM_PROVIDER=anthropic` | placeholder in `.env.example` | Get a key at https://console.anthropic.com/ |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` | Override to `claude-haiku-4-5-20251001` (cheap) or `claude-opus-4-7` (best) |
| `GEMINI_API_KEY` | Required if `LLM_PROVIDER=gemini` or `EMBEDDINGS_PROVIDER=gemini` | placeholder in `.env.example` | **Free tier** with 1M-token context; get a key at https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | no | `gemini-2.0-flash` | Override to `gemini-2.0-flash-exp` for the experimental tag, or `gemini-1.5-pro` for the older long-context model |
| `EMBEDDINGS_PROVIDER` | no | `stub` | `stub` \| `gemini`. Stub is deterministic hash-derived vectors (storage path works, vector search results meaningless). Gemini is real embeddings; reuses `GEMINI_API_KEY`. |
| `GEMINI_EMBED_MODEL` | no | `gemini-embedding-001` | Embedding model when `EMBEDDINGS_PROVIDER=gemini`. |
| `EMBEDDINGS_DIMENSIONS` | no | `768` | Vector dim. Must match the Atlas Search index spec (see §11). |
| `LLM_TIMEOUT_MS` | no | `30000` | Per-LLM-call timeout. Generous default; tighten in prod if needed |
| `JWT_TTL_DAYS` | no | `7` | live since Phase 1.5a — drives both JWT `expiresIn` and cookie `maxAge` |
| `RESET_TTL_MIN` | no | `30` | live since Phase 1.5b — password reset token lifetime in minutes |
| `AUTH_RATE_PER_MIN` | no | `10` | live since Phase 1.5c — per-IP requests/min on `/api/auth/login` + reset-request |
| `LOGIN_LOCKOUT_THRESHOLD` | no | `5` | live since Phase 1.5c — failed attempts before per-email soft lockout |
| `LOGIN_LOCKOUT_WINDOW_MIN` | no | `15` | live since Phase 1.5c — rolling-window length AND lockout duration |

**Never commit `.env`.** `.gitignore` already excludes it; confirm before every push.

---

## 4. Frontend env (`web/.env.local`)

```bash
cd web
cp .env.local.example .env.local
```

| Var | Default | Notes |
|---|---|---|
| `BACKEND_URL` | `http://localhost:4000` | **Server-only.** Where the Next BFF proxy at `app/api/[...path]/route.ts` forwards calls. FE only ever sees same-origin `/api/*`. |
| `NEXT_PUBLIC_API_BASE_URL` | (deprecated) | Legacy alias, read by the BFF as a fallback if `BACKEND_URL` is unset. New deploys should use `BACKEND_URL`. |

Start FE with `npm run dev` (boots on `:3000` by default).

---

## 5. Daily dev loop

Terminal 1 (Mongo — skip if using Atlas):
```bash
docker start skillgauge-mongo
```

Terminal 2 (BE):
```bash
cd backend && npm run dev
```

Terminal 3 (FE):
```bash
cd web && npm run dev
```

Smoke check:
- `/` loads
- Register → login → `/setup` → upload resume + JD → `/interview` flows question-by-question
- `curl -i http://localhost:4000/api/me --cookie "skillgauge_session=..."` returns `200` after login

---

## 6. Keeping it standing — operational checklist

### Before every commit
- `cd backend && npx tsc --noEmit && npm test` — 92/92 green
- `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` — 39/39 green
- Do NOT commit `.env` or any file that dumps secrets

### If the backend won't start
| Symptom | Likely cause | Fix |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | Mongo not running | `docker start skillgauge-mongo` or check Atlas allow-list |
| `env: JWT_SECRET required` | `.env` missing / too short | copy from `.env.example`, regenerate `JWT_SECRET` |
| CORS preflight 500 | `CORS_ORIGIN=*` with `credentials: true` | set an explicit origin |
| `MongoServerError: bad auth` | wrong Atlas credentials | regenerate user, URL-encode password |
| Port 4000 busy | stale `tsx watch` | `lsof -i :4000` on mac/linux, Task Manager on Windows |
| Tests hang 60s then timeout | first-run `mongodb-memory-server` download | let it finish; subsequent runs are fast |

### Rotating secrets
- `JWT_SECRET` rotation invalidates every session cookie — expected in Phase 1.5d via `jwt_epoch`
- Until then: rotate only during scheduled downtime; users will be forced to log in again

### Backup / disaster recovery (when we actually deploy)
- Atlas M0 has no automated backups — upgrade to M10+ or script `mongodump` on a cron before prod cutover (Phase 4d)
- Export/import: `mongodump --uri="$MONGODB_URI" --out=./dump`, `mongorestore --uri=... ./dump`
- Nothing in `backend/dist/` or `web/.next/` is authoritative — all state lives in Mongo + the cookie

---

## 7. CI expectations

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs two parallel jobs. Each must be green:

| Job | Working dir | Steps |
|---|---|---|
| `web` | `web/` | install → typecheck → test → build |
| `backend` | `backend/` | install → typecheck → test → build |

No external services in CI — `mongodb-memory-server` covers Mongo, `stubClient` covers the LLM. Do NOT add steps that need real API keys until Phase 2a (and guard them behind secrets + `if: ${{ secrets.OPENAI_API_KEY != '' }}`).

---

## 8. Immediate next steps to keep BE standing (prioritized)

These are concrete, low-risk items you should do before touching Phase 1.5 feature work. Each is ≤ 1 PR.

1. **Lock in a known-good Mongo setup on this dev machine** — decide Docker vs Atlas, document the chosen URI in a private note, and make sure `npm run migrate` succeeds against it. Everything else depends on this.
2. **Add a `scripts/dev.ps1` (or `Makefile` on mac/linux)** that boots Mongo + BE + FE in three panes — eliminates the "forgot to start mongo" class of failures.
3. **Add `GET /api/health/ready` that pings Mongo** — current `/api/health` is liveness-only. Readiness needs a `db.admin().ping()` so Phase 4 can hook a real load balancer later. Small add to [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts).
4. **Pin Node version with `.nvmrc`** at the repo root (`20` or `22`) — prevents "works on my machine" drift when a teammate joins.
5. **Wire `backend/.env.example` into the FE `web/README.md`** — currently the two READMEs don't cross-reference each other, and new contributors miss the `CORS_ORIGIN` ↔ `NEXT_PUBLIC_API_BASE_URL` pairing.
6. **Add a `docker-compose.yml`** at the repo root with a single `mongo` service + named volume. Avoids the `docker run` incantation from §1 and makes teardown `docker compose down` instead of `docker rm`.
7. **Write a one-page `RUNBOOK.md`** (when we move toward Phase 4 deploy) listing: how to tail logs, how to rotate JWT, how to restart, how to restore from backup, who to page. Stub it now so Phase 4 has a home for the content.
8. **Phase 1 + 1.5 + 1.6 + 2 are all fully complete (2026-04-25).** Next major milestone (out of the current plan's scope) is Phase 3 — long-term memory, real `GET /api/sessions` list, vector retrieval, `/dashboard` route. Until then: smoke-test the real LLM providers by adding an API key per §10 below.

---

## 9. When this file changes

Update in the same commit as:
- Any new env var (add to table + to [backend/.env.example](backend/.env.example))
- Any new required external service (Redis, S3, etc.)
- Any change to the dev-loop commands or ports
- Any phase transition that alters operational assumptions

---

## 10. How to get an LLM API key

Three adapters ship in the codebase: **OpenAI**, **Anthropic**, and **Gemini** (added 2026-04-26). Pick whichever fits your situation — the app works with any of them via the `LLM_PROVIDER` env. Until a key is configured, `LLM_PROVIDER=stub` (the default) keeps the deterministic stub running so local dev never blocks on this step.

### Option A — Google Gemini (recommended for personal use — FREE)

**Why this is the default recommendation now:** free tier with a 1 M-token context window and 15 requests/min / 1500 requests/day. Covers personal-app load comfortably without a credit card.

1. Go to **https://aistudio.google.com/apikey** and sign in with your Google account.
2. Click **Create API key**. Pick a project (or let it create one). Copy the key.
3. In [backend/.env](backend/.env) set:
   ```
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=PASTE_YOUR_KEY_HERE
   GEMINI_MODEL=gemini-2.0-flash
   ```
   Other model options: `gemini-2.0-flash-exp` (experimental tag), `gemini-1.5-pro` (older long-context).
4. Restart the backend (`cd backend && npm run dev`). The LlmBadge in the interview header auto-flips to `🤖 gemini · gemini-2.0-flash`.

### Option B — Anthropic Claude (paid)

The project's `gradeAnswer` uses Claude's tool-call shape natively; Claude's verbose feedback explanations are particularly good for interview prep.

1. Go to **https://console.anthropic.com/** and sign up (free trial credits, ~$5).
2. **Settings → Billing** → add a card. Trial credits cover dev; production volume needs funded balance.
3. **Settings → API Keys → Create Key**. Name it `skillgauge-dev`. Copy the key (starts with `sk-ant-...`).
4. In [backend/.env](backend/.env) set:
   ```
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-PASTE_YOUR_KEY_HERE
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```
   Other model options: `claude-haiku-4-5-20251001` (cheapest), `claude-opus-4-7` (best quality).
5. Restart the backend. The LlmBadge flips to `🤖 anthropic · claude-sonnet-4-6`.

### Option C — OpenAI (paid)

1. Go to **https://platform.openai.com/api-keys** and sign up.
2. **Billing → Payment methods → Add credit balance** (minimum $5).
3. **API keys → + Create new secret key**. Name it `skillgauge-dev`. Copy the key (starts with `sk-...`).
4. In [backend/.env](backend/.env) set:
   ```
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-PASTE_YOUR_KEY_HERE
   OPENAI_MODEL=gpt-4o-mini
   ```
   Other model options: `gpt-4o` (better, more expensive), `gpt-4-turbo` (legacy).
5. Restart the backend. The LlmBadge flips to `🤖 openai · gpt-4o-mini`.

### Failure modes (and how the BE tells you about them)

| What | What you see |
|---|---|
| `LLM_PROVIDER=<provider>` but its `*_API_KEY` is missing | BE fails to BOOT with: `LLM_PROVIDER=<provider> but <PROVIDER>_API_KEY is not set. Add the key to backend/.env or switch LLM_PROVIDER back to 'stub'.` |
| Bad API key (auth failure on first request) | 401 from the provider → adapter rejects without retry → request returns 503; BE pino log includes the provider's error |
| Provider 5xx / network timeout | One automatic retry after 500 ms; if still failing, request returns 503 |

### Cost-control reminders

- Per-user daily token quota + input-length guards are already wired (`DAILY_TOKEN_LIMIT`, `MAX_INPUT_CHARS` env vars).
- For dev, both providers' lowest-tier models (`gpt-4o-mini` / `claude-haiku-4-5`) cost ~$0.001 per interview question. Even heavy usage stays under $1/day at one user.
- Gemini's free tier is the recommended default — no cost at all up to 15 RPM / 1500 RPD.
- Production cost monitoring (real observability) is not yet shipped — track the daily quota collection manually for now.

---

## 11. Atlas Vector Search index

The long-term memory store (`memories` collection) requires an Atlas Vector Search index for the `searchSimilar()` retrieval path. Without it, writes still work (memory rows persist), but vector search returns no results.

### Creating the index

**Atlas UI** → cluster → **Atlas Search** tab → **Create Search Index** → **JSON Editor** → paste:

```json
{
  "name": "memory_vec_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "userId"
      }
    ]
  }
}
```

Target the `memories` collection in your `skillgauge` database. Index build takes ~1 minute on M0; status flips to "Active" when ready.

### When you'd need to rebuild

- **Switching embedding provider** with a different output dim — drop the index, change `EMBEDDINGS_DIMENSIONS`, re-create with the new `numDimensions`.
- **Re-embedding existing rows** because the model changed quality — write a one-shot script that walks `memories.find({})` and updates `embedding` in batches.

### Local dev without Atlas

Local mongods don't have Atlas Search. The storage path still works (`writeMemory` succeeds, the rows persist), but `searchSimilar()` calls will throw on the `$vectorSearch` aggregation. Callers treat memory retrieval as best-effort — failures degrade gracefully (no augmented context, the chat continues).

---

## 12. Human TODOs — actions only you can take

The codebase is feature-complete; these are the **manual steps** that have to happen outside the editor before features go from "implemented" to "live." Each item lists what to do, why, and what unblocks once it's done.

### Required to use the app at all

| # | Action | Why | Unblocks |
|---|---|---|---|
| 1 | Set `JWT_SECRET` in `backend/.env` (≥ 32 random chars) | Token signing — server refuses to boot in production without one | Auth (register / login) |
| 2 | Point `MONGODB_URI` at Mongo Atlas free tier (M0) **or** a local mongod | Persistence layer — without it nothing writes | Everything |
| 3 | Set `BACKEND_URL` in `web/.env.local` (e.g. `http://localhost:4000`) | Tells the Next BFF proxy where to forward `/api/*` calls | FE ↔ BE communication |
| 4 | **Start the backend** in a separate terminal: `cd backend && npm run dev` | Without the BE on port 4000 the BFF returns `502 BFF_UPSTREAM_UNREACHABLE` and every `/api/*` call surfaces as "BE unavailable" on the FE | Login + every authenticated flow |

### Highly recommended (free, ~5 min)

| # | Action | Why | Unblocks |
|---|---|---|---|
| 4 | Get a free Gemini key at <https://aistudio.google.com/apikey> | Real LLM grading instead of the deterministic stub. Free tier — no credit card | Real interview questions + feedback |
| 5 | Set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY=…` in `backend/.env` | Activates the Gemini adapter | Real LLM grading on the chat path |
| 6 | Set `EMBEDDINGS_PROVIDER=gemini` in `backend/.env` (reuses the same key) | Real embeddings for the memory layer | Vector search returns meaningful results |

### Optional — when you want vector search to work

| # | Action | Why | Unblocks |
|---|---|---|---|
| 7 | In Atlas UI → Search tab → create the `memory_vec_index` (JSON spec in §11) | Atlas Vector Search indexes can't be created via the standard driver | `$vectorSearch` aggregations on the `memories` collection |
| 8 | Wait ~1 minute for index status to flip to "Active" | Async build | First successful similarity search |

### Optional — paid LLMs

| # | Action | Why | Unblocks |
|---|---|---|---|
| 9 | OpenAI key at <https://platform.openai.com/api-keys> + add a credit balance | Alternative to Gemini if you prefer GPT models | Set `LLM_PROVIDER=openai` |
| 10 | Anthropic key at <https://console.anthropic.com/> + add a credit balance | Alternative to Gemini if you prefer Claude | Set `LLM_PROVIDER=anthropic` |

### Optional — production deploy

| # | Action | Why | Unblocks |
|---|---|---|---|
| 11 | Pick a BE host (Fly / Railway / Render — Vercel doesn't host long-lived Node well) | Production target for the Express server | Public BE |
| 12 | Set production env vars (JWT_SECRET, MONGODB_URI, CORS_ORIGIN, BACKEND_URL on FE) | Same envs as local, scoped to the deploy | Prod auth + DB |
| 13 | Enable HTTPS on the BE host | `Secure` cookie flag is set in production by `setSessionCookie` — without HTTPS the cookie won't be accepted | Cookie auth in prod |
| 14 | Lock CORS allow-list to your prod FE origin only | Defence in depth — the BFF makes broad CORS unnecessary, but a tight list never hurts | Smaller attack surface |

### Optional — known follow-ups (not blocking anything)

| # | Action | Why | Notes |
|---|---|---|---|
| 15 | Rewrite the BE test suite on `supertest(app)` | The Fastify-era `app.inject()` tests were soft-skipped during the Express migration | Drop `testPathIgnorePatterns` from `backend/jest.config.ts` after porting |
| 16 | Smoke-test a real LLM end-to-end | Verify `/api/sessions` produces real Gemini/OpenAI/Anthropic output | After action #5 — visit `/setup`, run a session, check the LlmBadge in the header |
| 17 | Add a "logout everywhere" button somewhere in the UI | The `POST /api/auth/logout-all` endpoint exists but isn't surfaced | Settings panel or UserMenu dropdown |
| 18 | Add `tests/**/*.js` + `tests/**/*.js.map` to `backend/.gitignore` | Stale ts-compile artifacts have shown up there twice; ignoring prevents recurrence | Defensive — not blocking |
| 19 | Replace the demo credentials in `web/features/auth/AuthModal.tsx` (`demo@skillgauge.ai` / `password123`) | Dev convenience that should not ship to a public deploy | Edit the form's `defaultValues` block |

### Workspace + UX status (shipped, here for reference)

| Surface | Status | Notes |
|---|---|---|
| `/` (unauth landing) | ✓ Single-viewport Server Component — hero + 3-step row + weighted footer with About dialog. Aurora ambient backdrop + animated gradient-text on the hero | Footer hosts the only client island (`SiteFooter.tsx`) for the dialog state |
| `/sessions` (auth landing) | ✓ Sidebar (chat history grouped résumé→day) + welcome + "Start new session" CTA + at-a-glance stats | Login + register + home CTA all redirect here |
| `/interview` | ✓ Hydrates from `?session=<id>` for past chatrooms; existing sessionStorage flow for new ones | "New session" header CTA appears when viewing a past/completed session |
| `/dashboard` | ✓ Stats grid + score-trend line chart + weak-areas frequency | Dashboard link in header for authed users |
| Logout | ✓ Tears down local auth state on success AND error so user always lands on `/` | Clear feedback via sonner toast |
| Dark theme | ✓ Lighter slate palette (Linear-ish) — `--color-background:#0f1218`, `--color-card:#181c25` | Tuned for readable contrast against gradient overlays |
| About dialog | ✓ Triggered from footer link; 5 sections (~700 words) on what SkillGauge is + why different + privacy stance + author | Plain-English only — no technical jargon ("httpOnly cookie", "audit logs") on marketing surfaces |
| Author attribution | ✓ **Kumar Nayan** · `mailto:kumarnayan.work@gmail.com` · current year | Lives in `SiteFooter.tsx` — single source of truth for public-facing identity |
| Brand mark | ✓ `GaugeCircle` icon inside `.brand-frame` (holographic gradient border that sweeps over 5s) | Matches the name's measurement metaphor; replaces the Brain icon |
| Delete chatroom | ✓ `DELETE /api/sessions/:id` with cascading delete (sessions → messages → memories) | Hover-revealed trash icon on `ChatroomEntry`, confirm dialog, sonner toast |
| Question bank | ✓ `GET /api/dashboard/resumes` returns one entry per distinct résumé filename with full chronological question list | Dashboard "My Résumés" panel has a Question bank modal listing every question ever asked of that résumé |
| Non-repetition guarantee | ✓ Past questions per résumé piped into every `generateQuestion` call site via `pastQuestionsForResume` in `QuestionContext`; v1 prompt adds "DO NOT repeat or paraphrase" block | Structurally enforced — not a claim, an instruction |
| Mobile / tablet responsive | ✓ `InterviewLayout` collapses sidebar into a drawer below `md`; resizable on desktop with persisted width | `role="dialog" aria-modal="true"` drawer, Escape to close, focus restored to hamburger |
| Animation primitives | ✓ `.brand-frame`, `.icon-tile`, `.lift-card`, `.pulse-dot`, `.shimmer`, `.animate-gradient-text`, `.stagger-fade`, Aurora | Pure CSS, zero runtime cost, all respect `prefers-reduced-motion` |
| `MAX_INPUT_CHARS` default | ✓ Bumped from 10000 → **60000** | Realistic résumé+JD+history payloads no longer trip 413 INPUT_TOO_LARGE |

---

## 13. Credentials + key rotation playbook

What to do when you need to change a connection string, swap an LLM provider, rotate a key, or move infrastructure. All of these are env-only changes (no code edits) followed by a BE restart.

### 13.1 Change MongoDB connection (new cluster, new database, password rotation)

Use this when: your Atlas password leaked, you're moving from M0 → M2, you want to point dev at a fresh DB, or you're switching between Atlas and a local mongod.

1. **Update the connection string** in `backend/.env`:
   ```bash
   MONGODB_URI=mongodb+srv://<user>:<password>@<host>/?appName=<cluster>
   MONGODB_DB=skillgauge_dev   # or whatever DB name you want
   ```
   - URL-encode any special characters in the password (`@` → `%40`, `:` → `%3A`).
   - For a local mongod: `MONGODB_URI=mongodb://127.0.0.1:27017`
2. **Restart the BE** (`Ctrl+C` then `npm run dev` in `backend/`).
3. **Verify**: tail the BE logs — you should see "Mongo connected" / no auth errors. Hit `/api/health` and check 200 OK.
4. **Indexes auto-create** on boot via `ensureIndexes()` — nothing to migrate manually for the schema. The `memory_vec_index` Atlas Search index is the **one exception**: it has to be re-created in the Atlas UI for the new cluster (see §13.4).

### 13.2 Swap or rotate the LLM provider key (Gemini, OpenAI, Anthropic)

Use this when: rotating a leaked key, moving from Gemini → OpenAI, or upgrading to a paid tier.

1. **Get the new key** from the provider's dashboard.
2. **Set it in `backend/.env`** (and clear the old one if rotating):
   ```bash
   # for Gemini:
   GEMINI_API_KEY=...
   LLM_PROVIDER=gemini
   GEMINI_MODEL=gemini-2.0-flash    # or gemini-2.5-flash, etc.
   ```
   ```bash
   # for OpenAI:
   OPENAI_API_KEY=sk-...
   LLM_PROVIDER=openai
   OPENAI_MODEL=gpt-4o-mini    # or gpt-4o, gpt-4-turbo
   ```
   ```bash
   # for Anthropic:
   ANTHROPIC_API_KEY=sk-ant-...
   LLM_PROVIDER=anthropic
   ANTHROPIC_MODEL=claude-sonnet-4-6    # or claude-haiku-4-5
   ```
3. **Restart the BE.** `createLLMClient()` boots the matching adapter on first request.
4. **Verify**: visit `/setup`, run a quick session — the FE's `LlmBadge` flips to show the active provider + model name in the interview header.
5. **Fall back to stub** any time by setting `LLM_PROVIDER=stub` (no key required). Useful for offline dev or to reproduce stub-only behaviour.

### 13.3 Swap embeddings provider

Same shape as 13.2 but the variable is `EMBEDDINGS_PROVIDER` (today: `stub` | `gemini`).

1. Set `EMBEDDINGS_PROVIDER=gemini` + `GEMINI_API_KEY=...` in `backend/.env`.
2. Restart the BE.
3. **Heads-up about dimension mismatches**: if you switch between two real providers that emit different vector sizes (e.g., 768 vs 1536), the existing rows in `memories` are now incompatible with new ones. You'd need to either (a) drop the `memories` collection and let it rebuild as new sessions run, or (b) keep `EMBEDDINGS_DIMENSIONS` matching the new provider AND drop+recreate the Atlas Search index (see §13.4) so its `numDimensions` matches.
4. Today both providers (`stub` + `gemini`) emit 768-dim vectors so this isn't a live issue — but document it here in case OpenAI's `text-embedding-3-small` (1536) gets added later.

### 13.4 Recreate the Atlas Vector Search index

Use this when: Atlas cluster moved, embedding dimension changed, or the index got corrupted.

1. Open Atlas → your cluster → "Search" tab.
2. If an old `memory_vec_index` exists on the new collection, delete it first.
3. **Create Search Index** → "JSON Editor" → database `skillgauge_dev` (or your DB name), collection `memories`, name **`memory_vec_index`**.
4. Paste:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 768,
         "similarity": "cosine"
       },
       { "type": "filter", "path": "userId" }
     ]
   }
   ```
   - If you switched embeddings to a 1536-dim provider, change `numDimensions` to match.
5. Wait for status → "Active" (~1 minute).
6. The BE doesn't need a restart for index changes; the next `searchSimilar` call picks it up.

### 13.5 Rotate `JWT_SECRET` (force every user to re-login)

Use this when: the secret leaked, you're cycling for hygiene, or you want to invalidate every outstanding session at once (a "logout everywhere, globally" hammer).

1. Generate a new secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. Replace `JWT_SECRET=...` in `backend/.env` with the new value.
3. Restart the BE.
4. Effect: every existing JWT cookie now fails verification → users hit `INVALID_SESSION` → the FE auto-redirects to `/`. No data is lost; users just sign in again.

### 13.6 Change `BACKEND_URL` (move BE to a different host / port)

1. Update `web/.env.local`:
   ```bash
   BACKEND_URL=https://api.skillgauge.example.com
   ```
   The BFF proxy reads this server-side, so the value never reaches the browser bundle.
2. **Update `CORS_ORIGIN` in `backend/.env`** to include the FE's origin (comma-separated for multiple):
   ```bash
   CORS_ORIGIN=https://skillgauge.example.com,http://localhost:3000
   ```
3. Restart both BE + FE dev servers (or redeploy).

### 13.7 Tune cost guards

`DAILY_TOKEN_LIMIT` (per-user daily LLM-token cap; default 100 000) and `MAX_INPUT_CHARS` (per-call input cap; default 60 000) live in `backend/.env`. Bump or lower them as your usage scales — restart picks up the new values. The user gets a friendly `QUOTA_EXCEEDED` (402) or `INPUT_TOO_LARGE` (413) error from the API; no crash, no silent over-spend.
