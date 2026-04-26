# SkillGauge — Operational Requirements

**Scope:** what you need to install, configure, and run to keep the **backend** (and FE talking to it) stand up locally and in CI. Keep this file in lockstep with [backend/.env.example](backend/.env.example) and [backend/package.json](backend/package.json).

**Last updated:** 2026-04-25 (Phase 2 fully complete — all of 2b/2a/2e/2c/2d shipped. Plan target reached.)

---

## 1. One-time machine setup

| Requirement | Version | Why |
|---|---|---|
| Node.js | ≥ 20 (LTS 22 recommended) | Fastify 5 + Next 16 baseline |
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
| `LLM_PROVIDER` | **yes** | `stub` | `stub` today. `openai` / `anthropic` land in Phase 2 |
| `OPENAI_API_KEY` | Required if `LLM_PROVIDER=openai` | — | Sign up at https://platform.openai.com/. See §10 for full instructions |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | Override to `gpt-4o` for higher quality |
| `ANTHROPIC_API_KEY` | Required if `LLM_PROVIDER=anthropic` | — | Sign up at https://console.anthropic.com/. See §10 |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` | Override to `claude-haiku-4-5-20251001` (cheap) or `claude-opus-4-7` (best) |
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
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | must match backend `HOST:PORT` and be in backend's `CORS_ORIGIN` |

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

Both OpenAI and Anthropic adapters ship in the codebase as of Phase 2a/2e. Pick one provider — the app will work with either via the `LLM_PROVIDER` env. Until a key is configured, `LLM_PROVIDER=stub` (the default) keeps the deterministic stub running so local dev never blocks on this step.

### Option A — Anthropic Claude (recommended)

Recommended because the project's `gradeAnswer` uses Claude's tool-call shape natively, and Claude's verbose feedback explanations are what users want for interview prep.

1. Go to **https://console.anthropic.com/** and sign up (free trial credits, ~$5).
2. **Settings → Billing** → add a card. Trial credits cover dev; production volume needs funded balance.
3. **Settings → API Keys → Create Key**. Name it `skillgauge-dev`. Copy the key (starts with `sk-ant-...`).
4. In [backend/.env](backend/.env) set:
   ```
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```
   Other model options: `claude-haiku-4-5-20251001` (cheapest), `claude-opus-4-7` (best quality).
5. Restart the backend (`cd backend && npm run dev`). The LlmBadge in the interview header auto-flips from `🤖 stub` to `🤖 anthropic · claude-sonnet-4-6`.

### Option B — OpenAI

1. Go to **https://platform.openai.com/signup** and sign up.
2. **Billing → Payment methods → Add credit balance** (minimum $5).
3. **API keys → + Create new secret key**. Name it `skillgauge-dev`. Copy the key (starts with `sk-...`).
4. In [backend/.env](backend/.env) set:
   ```
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```
   Other model options: `gpt-4o` (better, more expensive), `gpt-4-turbo` (legacy).
5. Restart the backend. The LlmBadge auto-flips to `🤖 openai · gpt-4o-mini`.

### Failure modes (and how the BE tells you about them)

| What | What you see |
|---|---|
| `LLM_PROVIDER=openai` but `OPENAI_API_KEY` missing | BE fails to BOOT with: `LLM_PROVIDER=openai but OPENAI_API_KEY is not set. Add the key to backend/.env or switch LLM_PROVIDER back to 'stub'.` |
| Same for `anthropic` | Equivalent error message |
| Bad API key (auth failure on first request) | 401 from the provider → adapter rejects without retry → request returns 503; BE pino log includes the provider's error |
| Provider 5xx / network timeout | One automatic retry after 500 ms; if still failing, request returns 503 |

### Cost-control reminders

- Phase 2d (next sub-phase after parsing) adds per-user daily token quota + input-length guards.
- For dev, both providers' lowest-tier models (`gpt-4o-mini` / `claude-haiku-4-5`) cost ~$0.001 per interview question. Even heavy usage stays under $1/day at one user.
- Production cost monitoring is Phase 4d (observability) — not yet shipped.
