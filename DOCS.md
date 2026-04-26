# SkillGauge — Documentation Map

A one-page index of every doc file at the repo root, what it's for, and when to read it.

| File | Purpose | Read it when… |
|---|---|---|
| [README.md](README.md) | Quick-start: clone, install, run, basic project description. | You just landed in the repo and want to get the dev server up. |
| [CLAUDE.md](CLAUDE.md) | Working agreement with the AI assistant — which docs to keep in sync, how to track phases, what manual setup to surface. | When the assistant updates code; the CLAUDE.md rules govern doc-sync expectations. |
| [requirements.md](requirements.md) | The product + technical spec, scoped per phase. Includes §10 (LLM key setup), §11 (Atlas Vector Search index spec), §12 (Human TODOs — manual setup actions), §13 (credentials + key rotation playbook), and the live UX/Workspace status table. | You need the canonical "how does this thing actually work" reference, OR you need to swap a Mongo / LLM / vector-DB credential. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Living architecture reference — full stack tour: FE (Next.js) and BE (Express + MongoDB), the LLM abstraction, the embeddings + memory layer, the BFF, theming. Updated in the same commit as any structural code change. | You're about to add a feature and need to see how the existing pieces fit, OR you're onboarding to the codebase. |
| [PROGRESS.md](PROGRESS.md) | Build changelog. Newest entries at the top of each phase block. Every shipped pass gets a paragraph here describing what changed and why. | You want to know what was done last week, or you need to write a release-note-style summary of recent work. |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Top-line "where the build is right now" — a tighter executive summary than PROGRESS.md, updated with each pass. | Skim before starting a new session to get oriented in 30 seconds. |

## Reading order for a fresh contributor

1. **README.md** — get the app running locally.
2. **DOCS.md** (this file) — figure out what to read next.
3. **IMPLEMENTATION_STATUS.md** — current state in 30 seconds.
4. **ARCHITECTURE.md** — full stack tour before touching code.
5. **requirements.md §12** — the manual-setup checklist (API keys, Atlas index, etc.).
6. **PROGRESS.md** (skim) — recent context: what changed, why.

## Doc-sync expectation (per CLAUDE.md)

After any code change, four files should reflect the new reality:

- **PROGRESS.md** — append a paragraph to the relevant phase block (newest on top).
- **ARCHITECTURE.md** — only if structural (new module, new route, new layer).
- **IMPLEMENTATION_STATUS.md** — refresh the top-line status if the change shifted the project's "what works" line.
- **requirements.md** — only if the change introduces new manual-setup steps, new env vars, or rotates the credentials playbook.

## Where things are NOT documented

- Per-component prop docs live as JSDoc-style comments in the component file itself, not in MDs. If you need the API of `<ScoreRadial>`, open `web/components/ScoreRadial.tsx`.
- LLM prompt templates have their own docstring at the top of `backend/src/llm/prompts/v1/*.ts` — that's the source of truth, not the MDs.
- The auto-memory at `~/.claude/projects/.../memory/` is the assistant's working memory, not a project doc — don't treat it as authoritative.
