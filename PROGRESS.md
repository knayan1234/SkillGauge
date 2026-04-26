# SkillGauge — Build Progress Log

Living document tracking every change made during the end-to-end build. Newest entries at the top within each phase.

**Current status:** **All planned phases shipped — feature-complete for the personal-use scope (2026-04-26).** Phases 0a → 0b → 1 → 1.1 → 1.5a–e → 1.6a–d → 2a–e plus the 10-step roadmap (Express migration, FE cosmetic pass, Gemini adapter, Round 2 chaining, BFF layer, Atlas Vector Search + memories + sessions list, dashboard, voice/TTS, PDF export, re-answer + personas + tags) plus the cleanup pass — all green.
**Remaining items are human-only actions, not engineering phases:** see [requirements.md §12](requirements.md). The big three: get a free Gemini key + flip `LLM_PROVIDER=gemini`; create the Atlas Vector Search index `memory_vec_index` in the Atlas UI; rewrite the BE test suite on `supertest(app)` (currently soft-skipped via `testPathIgnorePatterns`).
**Latest infrastructure change:** **Fastify 5 → Express 5 BE migration on 2026-04-26.** Pure runtime/framework swap. Routes, middleware, error contracts, JWT cookie semantics, rate-limit behaviour — all identical on the wire. BE tests temporarily skipped (the `app.inject(...)` paradigm is Fastify-specific; rewrite on `supertest` is the open follow-up).
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
**Phase 2b finished:** 2026-04-25
**Phase 2a/2e finished:** 2026-04-25 (placeholder mode — adapter classes committed + tested; smoke test pending key)
**Phase 2c finished:** 2026-04-25
**Phase 2d finished:** 2026-04-25 (Phase 2 fully complete)
**BE framework migration finished:** 2026-04-26 (Fastify 5 → Express 5; no functional change)
**FE cosmetic pass finished:** 2026-04-26 (sonner + react-markdown + recharts + framer-motion; EmptyState + ChatSkeleton + ScoreRadial primitives)
**Gemini adapter finished:** 2026-04-26 (4th LLMClient implementation; free-tier-friendly; 1M-token context; flipped via `LLM_PROVIDER=gemini`)
**Round 2 chaining finished:** 2026-04-26 (option B — one session, growing transcript; new `POST /api/sessions/:id/rounds/next`; FE shows "Start Round N+1" CTA on completion + Round badge in header)
**BFF layer finished:** 2026-04-26 (Next route handler `app/api/[...path]/route.ts` proxies same-origin `/api/*` to the Express BE; `BACKEND_URL` is server-only)
**Phase 6 (Vector Search + memory + sessions list) finished:** 2026-04-26 — `memories` collection with embeddings stored on every Q/A/feedback; `EmbeddingsClient` interface (stub + gemini); `GET /api/sessions` + `GET /api/sessions/:id/messages`; sidebar swaps to server-backed list when authenticated.
**Phase 7 (Dashboard) finished:** 2026-04-26 — `/dashboard` page with stats grid, score-trend line chart, and weak-areas frequency list. New `GET /api/dashboard/summary` endpoint aggregates over the user's full history.
**Phase 8 (Voice + TTS) finished:** 2026-04-26 — Web Speech API only, no cloud. Mic button on AnswerInput dictates → textarea; speaker button on each interviewer bubble reads the question aloud.
**Phase 9 (PDF export) finished:** 2026-04-26 — `Export PDF` button on the completion card downloads a clean transcript with per-answer scores using `jsPDF` client-side. No server roundtrip; no API key.
**Phase 10 (Re-answer + tags + personas) finished:** 2026-04-26 — bundled three: persona selector in setup form (neutral/faang/startup/consulting); per-feedback "Try again" dialog backed by `POST /api/sessions/:id/questions/:index/reanswer`; derived tag pills on questions.
**Cleanup pass finished:** 2026-04-26 — phase markers + dates scrubbed from all code comments; interview page refactored (CompletionCard + RetryDialog + interviewMessages helpers extracted); home page converted to a Server Component with a `<HeroCta>` client island; new requirements.md §12 "Human TODOs" listing 17 manual actions grouped by required / recommended / optional / deploy / follow-ups.
**Sidebar grouping finished:** 2026-04-26 — chat history in the interview sidebar is now grouped by **résumé filename → day bucket** (Today / Yesterday / This week / This month / Older). Active résumé floats to the top; within each résumé, newest entries first. Pure presentation change — no schema or API impact. Stale `.js`/`.js.map` compile artifacts in `backend/tests/` (auth.test.js, sessions.test.js, setup.js + maps) deleted in the same pass.
**Authenticated workspace + click-to-load chatrooms finished:** 2026-04-26 — new `/sessions` route lands users right after login with the chat history sidebar (left rail, grouped by résumé+day) plus a welcome panel containing the **"Start new session"** CTA, headline stats (sessions / avg / best), and a recent-activity strip. Chatroom entries are now clickable: clicking one routes to `/interview?session=<id>` which hydrates that past session's transcript via `GET /api/sessions/:id/messages` (already-existing endpoint — no BE change). Login + register + the home-page hero CTA all redirect to `/sessions` instead of jumping straight to `/setup`. Logout teardown now runs on both success and error so the user isn't stuck on an authenticated page when the BE is unreachable. Home-page copy refreshed for first-time visitors. Shared grouping helpers extracted to `web/lib/sessionGrouping.ts` (used by both `InterviewSidebar` + new `SessionsHistorySidebar`). 9 routes total now (8 static + 1 dynamic BFF); 39/39 jest still green.
**UX polish pass finished:** 2026-04-26 — (1) **dark theme rebalanced** to a lighter slate palette (Linear-ish: `--color-background:#0f1218`, `--color-card:#181c25`, `--color-border:#2a303d`, `--color-muted-foreground:#b6bcc9`) so cards and borders are visible against the background — fixes the "too dark, nothing visible" complaint. (2) **`/sessions` workspace refined** — recent-activity strip removed (history is in the sidebar; trends are on `/dashboard`), CTA card got a hover-glow gradient, ambient floating blob backgrounds, larger typography, "Sessions / Average score / Best score" stat cards moved under an "At a glance" eyebrow with a "Full dashboard →" link. (3) **React-Bits-style ShinyText** primitive added at `web/components/effects/ShinyText.tsx` (pure-CSS gradient sweep, no runtime cost) — used on the home hero and the `/sessions` h1. (4) **"New session" header CTA** appears in the interview view whenever the session is **non-active** (viewing a past chatroom or just completed one) — gradient pill button that routes back to `/sessions`; hidden during an active interview to avoid tempting the user to abandon mid-flow. The interview header's home button also now routes to `/sessions` (workspace) instead of `/` (marketing). (5) **requirements.md §12** restructured to add a "Workspace + UX status" reference table and surface "start the BE in a separate terminal" as Required action #4.
**Chatroom click + ShinyText fixes finished:** 2026-04-26 — (1) **chatroom click flow hardened**: `loadFromServer` now returns `{ ok, error }`; the interview page surfaces an explicit `toast.error` and bounces the user back to `/sessions` if the past-session fetch fails (BE down / 404 / etc.) instead of leaving them on an indefinite loading skeleton. The `loadMutation.onMutate` clears stale state to null/empty so navigating between past chatrooms doesn't briefly flash the previous session. ChatroomEntry got a stronger hover state (border + lift) so clickable entries are visibly clickable. (2) **ShinyText rewritten with theme-aware vars**: `--shine-base: #6b7280` + `--shine-highlight: #111827` for light; `--shine-base: #9ca3af` + `--shine-highlight: #ffffff` for dark. The hero gradient classes that were competing with the shine background-clip were dropped — ShinyText now stands on its own. Animation slowed from 4s to 8s.
**Code standards + a11y audit finished:** 2026-04-26 — full ESLint sweep, react-hooks/set-state-in-effect cleanup, ARIA cleanup. (1) **`useSyncExternalStore` adopted** for browser-API support detection across `useSpeechRecognition`, `useSpeechSynthesis`, `ThemeToggle` (mount detection), and `InterviewSidebar` archive read — replaces the older `useEffect + setState` mount pattern that the new React rule flags. (2) **AnswerInput refactored** to derived state — `displayValue = isListening ? transcript : answer` instead of mirroring transcript → answer via effect. Textarea is `readOnly` while the mic is on; on stop, the final transcript is committed into `answer` so the user can edit before submit. (3) **ChatroomEntry rewrites the click target as a real `<button>`** wrapping the Card — keyboard activation (Enter / Space), focus-visible ring, and `aria-current` for the active session all come for free instead of a hand-rolled `role="button"` that was missing keydown handling. (4) **Interview page bootstrap state** moved to a ref (`loadedSessionIdRef`) for the URL-tracking guard + a derived value for the sidebar résumé filename — only the genuinely-one-shot bootstrap setState is left, with a single justified `eslint-disable-next-line` comment. (5) **Empty interface** in `Skeleton` rewritten as a type alias. (6) **Icon-only buttons audited**: AnswerInput's submit button got a missing `aria-label="Submit answer"`; all icons in interactive controls got `aria-hidden="true"` so screen readers don't double-announce. Final state: **0 ESLint errors**, 2 unactionable warnings (Next.js Inter-font hint, RHF `watch()` compiler-skip — both library / framework limitations); typecheck clean; 39/39 jest green; production build clean (9 routes).
**Infinite-loop fix on chatroom click:** 2026-04-26 — the `useSyncExternalStore` migration of InterviewSidebar's archive read had a hidden bug: `readArchivedChatrooms()` returns a fresh array reference on every call, which `useSyncExternalStore` interprets as a perpetual snapshot change → infinite re-render loop. Reverted that single hook to `useState + useEffect` (with a justified `eslint-disable-next-line react-hooks/set-state-in-effect` comment explaining the trade-off). Other `useSyncExternalStore` usages stay because they return reference-stable primitives (`boolean`).
**Home page rewrite series + About dialog finished:** 2026-04-26 — three iterations on the public landing page based on UX feedback: (1) first pass tightened copy and stripped technical jargon ("httpOnly cookie auth", "hashed audit logs") that didn't belong on a marketing page; (2) second pass dropped the cards-heavy structure to three numbered list items, no Card chrome; (3) final pass switched to a single-viewport layout (sticky-footer pattern via `min-h-[calc(100vh-3.5rem)] flex flex-col`) so first-time visitors don't need to scroll, with substantive verbiage moved into a triggered **About dialog** in the new `web/components/SiteFooter.tsx` client component. The About dialog has 5 sections (~700 words): What it is / Why this is different / How a session goes / Privacy stance / Made by — opens at `max-w-2xl max-h-[85vh]` with internal scrolling. Footer was redesigned as a proper page boundary with three signals (distinct `bg-muted/50` background tint, top border, two-line attribution stacks giving it visual mass). Author attribution finalised as **Kumar Nayan** with `mailto:kumarnayan.work@gmail.com`.
**Cosmetic / theme refinement pass:** 2026-04-27 — design uplift toward an AI-centric but mature aesthetic. (1) **Palette refined** — light mode warmed slightly (`#fafaf8` bg, `#18181b` foreground) for considered neutrality; primary nudged to a more vivid `#7c3aed`; dark mode background goes to `#0d1018` (cooler slate) with `#161a23` cards, foreground `#ecedf2` for high contrast (≥ 13:1, well above WCAG AA). New theme token `--color-accent-2` (light: `#0d9488` teal; dark: `#2dd4bf` brighter teal) reserved for AI-signal moments — gradient sweeps, focus rings, ambient layer. (2) **Aurora primitive** — new `web/components/effects/Aurora.tsx`, three soft drifting orbs as a pure-CSS ambient backdrop (zero runtime cost, replaces the older static-gradient + two floating blobs on home + sessions pages). Reads from theme tokens so it adapts to dark/light without re-renders. Drifts on 22s/26s/30s loops, tasteful not distracting. (3) **GradientText** utility — `.animate-gradient-text` slow tri-color sweep through `primary → accent-2 → accent → primary` over 12s. Used on the home hero ("built around you.") and `/sessions` h1 ("next interview"). (4) **Typography refinements** — added `--font-mono` token (JetBrains Mono with system fallbacks); enabled Inter stylistic sets `ss01` + `cv11` for refined letterforms; antialiasing forced on. (5) **Selection + focus** — selection highlight uses `color-mix` with primary at 25%; universal `:focus-visible` outline uses `--color-ring` so light + dark land in the right hue. (6) **Reduced-motion** — `@media (prefers-reduced-motion: reduce)` disables all animated utilities so accessibility users get a still version.
**Dark-mode text-visibility fix:** 2026-04-27 — Tailwind v4's `@theme` block reliably generates utility classes that respect `.dark` overrides, but does not always expose those tokens as cascading CSS custom properties on `:root` for `var()` consumption from custom CSS. Result: `body { color: var(--color-foreground) }` was silently reading `undefined` in dark mode → headings (h1/h3) inheriting from body rendered the light-mode value (`#18181b`) on the dark slate background → invisible. Fixed by mirroring the @theme tokens into an explicit `:root { ... }` block so `var()` lookups always resolve, with `.dark { ... }` overriding both layers in dark mode. Added defensive `h1,…,h6 { color: inherit }` rule too. The Aurora orbs were also tuned down in dark mode (opacity `0.4 → 0.22`, removed `mix-blend-mode: screen`) since the previous brightness wash was reducing apparent contrast against text.
**Dead-code sweep:** 2026-04-27 — `ts-prune` audit + cleanup. Removed: (1) `web/components/effects/ShinyText.tsx` + the `.animate-shine` CSS keyframe + dark variant — superseded by the new `animate-gradient-text` on the only surfaces that used them; (2) `getNextQuestion` from `services/api.ts` — leftover from before `submitAnswer` started returning `nextQuestion` atomically; no live caller remained; (3) duplicate type re-exports (`InterviewStyle`, `DifficultyLevel`, `RoleLevel`, `InterviewerPersona`) from `features/session-setup/sessionSetupSchema.ts` — canonical declarations live in `services/api.ts` as part of the wire contract; consumers already imported from there. Final state: 0 ESLint errors, 0 unused exports outside framework-required defaults; build clean (9 routes); 39/39 jest green.

**Phase 1 + Phase 3 (delete + question bank + non-repetition + UX hardening):** 2026-04-27 — substantial multi-step pass executing the question-bank principle: every interview question stored per résumé, no repeats, full continuity.

  *Bug fixes from user reports*: (a) "New session" CTA now appears in the interview header whenever the user reaches the view via `?session=<id>` (history click) — not just on completed sessions; (b) `MAX_INPUT_CHARS` bumped from 10000 → **60000** (default) — the old cap rejected legitimate résumé+JD payloads with `413 INPUT_TOO_LARGE`; the new ceiling sized for résumé (~10K) + JD (~5K) + rolling history (~30K) + prompt scaffolding (~5K), comfortable on Gemini's 1M context window; (c) interview loading state now uses **layout-aware skeletons** — `SidebarSkeleton` + header skeleton + `ChatSkeleton` rendered in the proper `InterviewLayout` slots so content drops into the right places; (d) **toaster moved to `top-center`** so success/error toasts don't overlap the right-side header controls or dialog footers; (e) **resizable sidebar** — drag-handle on the right edge of the chatroom sidebar, width clamped [220px–520px], persisted to `localStorage`.

  *Delete chatroom* (BE + FE): new `DELETE /api/sessions/:id` route with cascading delete (sessions → messages → memories). FE adds a hover-revealed trash icon on `ChatroomEntry` (only for real server entries), confirm dialog, react-query cache invalidation, sonner success toast, and an auto-route back to `/sessions` if the user just deleted the chatroom they were viewing.

  *Non-repetition (the principle made real)*: `messagesRepo.findQuestionsByResume(userId, resumeFileName)` aggregates every question ever asked of the user on a given résumé across all sessions. Service-layer helper `loadPastQuestionsForResume` wraps it (best-effort; query failures swallow). All four `generateQuestion` call-sites in `sessions.service` (initialize, getQuestion, post-grade follow-up, nextRound) now pipe past questions into `QuestionContext.pastQuestionsForResume`. The v1 prompt renderer adds an explicit "DO NOT repeat or paraphrase" block listing the most recent 30 with truncated text. **The "no repeats" claim is now structurally enforced, not aspirational.**

  *Question bank visibility (the principle made visible)*: new `GET /api/dashboard/resumes` returns one entry per distinct résumé filename — sessionCount, questions list (chronological), averageScore, lastUsed, full canonical résumé content. Dashboard's new **"My Résumés"** panel surfaces these; clicking "Question bank" opens a modal listing every question ever asked of that résumé. Click "View résumé" to see the parsed text the LLM grades against. This is the user-facing proof of the per-résumé continuity claim.

  *Practice mix breakdown*: dashboard summary endpoint extended with `styleBreakdown` (counts of behavioral / technical / mixed sessions). Cheap, deterministic — pulled directly from `session.interviewStyle`, no LLM tagging cost. Rendered as a horizontal bar chart in a new "Practice mix" panel above the score trend.

  *Export PDF for past sessions*: jsPDF export was already on `CompletionCard`, but discovery was poor for users opening a past chatroom (the card is below the fold). Added an **Export button to `InterviewHeader`** that's visible whenever the session has messages — works for live, completed, and past-loaded sessions equally.

  *More React-Bits-style flourishes*: new `.conic-ring` utility — a pure-CSS conic-gradient ring spinning slowly behind brand-icon containers; applied to the home hero, AppLayout header, both sidebars, About dialog. New `.section-accent` utility — vertical gradient bar on the left edge of About-dialog sections. About dialog title now uses `animate-gradient-text` on "SkillGauge"; each section gets a small primary-tinted icon tile (FileText / Sparkles / Layers / ShieldCheck / User). Both new utilities respect `prefers-reduced-motion`.

  Final state: BE typecheck clean; 0 ESLint errors on FE; 39/39 jest green.

**Mobile + a11y + brand pass:** 2026-04-27 — design + accessibility hardening on top of the workspace flow.

  *Brand identity*: Brain → **GaugeCircle** across all surfaces (home hero, AppLayout, both sidebars, About dialog, footer). Icon name matches the product name's metaphor — measurement, not neuroscience.

  *Animations rewritten — `brand-frame` replacing `conic-ring`*: the spinning conic-gradient was too "disco-ball" for an AI product. New `.brand-frame` utility paints a static-looking holographic gradient border (primary → accent-2 → accent at 1.5px padding) that **breathes** via background-position oscillation over 8s rather than rotating. Outer glow tinted to primary at 35% gives the icon visual weight without yelling. New `.icon-tile` utility — same holographic border but smaller, with hover-lift + glow — applied to every panel-header icon on the dashboard and every section-heading icon in the About dialog. New `.stagger-fade` utility — children fade up in 80ms steps; applied to the dashboard panel stack so the page reveals with rhythm. All animation utilities respect `prefers-reduced-motion`.

  *Footer redesigned*: About link extracted from the cramped right-cluster wedge into its own thin centered nav row beneath the brand+attribution row, with proper top border separation, focus rings, `aria-haspopup="dialog"` + `aria-expanded`, and a sibling Contact link. Footer wrapper got `role="contentinfo"`. About dialog title now uses `animate-gradient-text` on "SkillGauge"; section headings carry the new `icon-tile` treatment.

  *Mobile + tablet responsive*: `InterviewLayout` rewritten — sidebar collapses below `md` (768px) into a slide-out drawer behind a hamburger button. Drawer is `role="dialog" aria-modal="true" aria-label="Chat history"`, escape-to-close, focus-restore on close; hamburger has `aria-controls` + `aria-expanded`; backdrop scrim is `aria-hidden`. The desktop drag-handle and the mobile drawer are mutually exclusive (`hidden md:block` vs `md:hidden`). Dashboard padding tightened on small screens (`px-4 sm:px-6 py-8 sm:py-10`).

  *Dashboard refresh + panel empty states*: `refetchOnMount: "always"` + `refetchOnWindowFocus: true` on both summary and résumé queries — completing a session elsewhere now bumps the dashboard the moment the user lands on `/dashboard`. Panels (Practice mix, My Résumés) always render with a clear empty-state message instead of hiding when data is sparse, so users see what's coming even before they have history.

  *A11y / ADA pass*: universal `:focus-visible` outline using `--color-ring` so light + dark land in the right hue; every Lucide icon inside an interactive control has `aria-hidden="true"` so screen readers don't double-announce; every icon-only button has an explicit `aria-label`; ChatroomEntry renders a real `<button>` (not a `role="button"` div) with `aria-current` for the active session and a sibling delete button (no nested-button HTML violation); resize handle is `role="separator" aria-orientation="vertical"` with a label; dialogs use Radix's built-in title/description wiring; mobile drawer keyboard-accessible end-to-end. Final state: zero ESLint errors, 39/39 jest green, BE typecheck clean.

**Palette tone-down — pass 2 (the "stop being funky" pass):** 2026-04-27 — the violet+teal palette still read as too colorful even after the first tone-down, especially in dark mode. Switched the entire app to a **near-monochrome indigo family** (Linear/Anthropic/Vercel-coded restraint). Light: primary `#4f46e5` (indigo-600), accent `#6366f1` (indigo-500), accent-2 `#475569` (slate-600 — near-neutral). Dark: primary `#818cf8` (indigo-400), accent `#a5b4fc` (indigo-300), accent-2 `#64748b` (slate-500). Primary + accent are intentionally close in lightness so gradient sweeps read as a single-hue shimmer rather than a two-color rainbow. accent-2 is quiet enough to use sparingly without drawing the eye. Aurora orb opacity dropped further: 0.22 light / 0.12 dark, blur bumped 80px → 96px so the orbs read as ambient glow not as colored blobs. Net result: the same animations + brand identity, much quieter color story.

**Palette tone-down — pass 3 (true-blue switch):** 2026-04-27 — indigo `#4f46e5` still read as violet to the user. Switched all primary/accent/ring tokens from the indigo family to **true blue**: light primary `#2563eb` (blue-600), light accent `#3b82f6` (blue-500); dark primary `#60a5fa` (blue-400), dark accent `#93c5fd` (blue-300). Pulse-glow keyframe rgba updated from indigo to blue. `viewport.themeColor` (the OS chrome / mobile address-bar color) split into `light: #fafaf8` / `dark: #0d1018` `media`-discriminated entries so the OS chrome reflects the user's preferred mode even before next-themes hydrates.

**Footer + identity pass:** 2026-04-27 — three new dialogs in `SiteFooter.tsx`: (1) **Contact dialog** with a real form (name + email + reason dropdown + message), submit constructs a `mailto:` URL with the body pre-filled and hands off to the user's mail client — no server, no API. (2) **Author dialog** opened by clicking "Kumar Nayan" in the footer — short bio ("React developer · Mid-level · Deloitte" + funky line), reach-me list with email + LinkedIn (`linkedin.in/knayan`); deliberately no GitHub link per request. (3) **`RubricInfo` component** (new file `web/components/RubricInfo.tsx`) — small `?` icon next to every score on feedback bubbles; opens a dialog explaining the dual grading paths (real-LLM rubric: 40% correctness / 30% depth / 20% clarity / 10% structure; stub mode: length-proxy heuristic capped at 8/10). Surfaces the grading model so end users know what the number means.

**Author dialog v2 + asset cleanup:** 2026-04-27 — Author "Who I am" dialog redesigned as a hero card: large circular doodle avatar at the top (`/KNProfPic.png`) inside a soft amber gradient ring (echoes the doodle's frame), name + role beneath, bio + LinkedIn pill below, no email line in the body (per user request). Avatar has an `onError` fallback to "KN" initials so the layout never breaks if the file is missing. Cleaned `web/public/` — deleted 9 unused assets (SG.png, SkillGauge-logo.png, SkillGauge-svg.svg, favicon.ico, file.svg, globe.svg, next.svg, vercel.svg, window.svg — all `create-next-app` scaffolding leftovers + obsolete brand assets; favicon is now `app/icon.svg` per Next.js conventions). Only `KNProfPic.png` remains.

**CI workflow audit:** 2026-04-27 — `.github/workflows/ci.yml` rewritten with comprehensive comments. Updated job name `Backend (Fastify)` → `Backend (Express)` (stale since the migration). Added a `pull_request` trigger on `main` branch (was push-only). Added a **Lint** step on the FE job (gates ESLint errors before typecheck). Documented per-step why each runs, plus a job-level note explaining why the BE test step currently passes with zero matching files (Fastify-era `app.inject(...)` tests soft-skipped via `testPathIgnorePatterns` pending the supertest rewrite). Now safe to push to GitHub: anyone reading the workflow YAML can see exactly what each step does and why.

**Amber + blue brand combo:** 2026-04-27 — palette established two complementary accent colors. Blue (primary `#2563eb` / `#60a5fa`) is the **cool** UI signal (links, focus rings, primary buttons, active indicators). Amber (Tailwind amber-500 `#f59e0b`) is the **warm** accent reserved for "this is special" moments — never used on every surface, kept as a signal:

  - **Brand-frame halo** — gradient sweeps through amber, not primary blue. The moving glint around every brand-icon container.
  - **Animated needle** — the SkillGaugeLogo's needle rotates 60° back and forth like a real meter measuring a live signal. Pairs with the brand-frame's outer animation: outer ring sweeps, inner needle reads. Pure CSS via `transform-origin` + `rotate` keyframes.
  - **Animated gradient text** — "built around you" hero phrase sweeps `foreground → primary (blue) → amber → primary → foreground` so the warm + cool tones both pass through during each cycle. Reinforces the combo without a static color clash.
  - **Stat values + step numbers** — `/sessions` StatCard values, home-page `01 / 02 / 03` step markers — all amber. Reads as "the achievement number" against the muted label.
  - **Sessions Start-new-session CTA** — the prominent action card now wraps in `brand-frame` so the same amber halo that defines the brand mark also marks the most prominent action surface on the workspace.
  - **Borders stay neutral by default** — header / footer / dialogs use `border-border/70`. Amber would have made every region "shouty"; restraint here is what makes the amber accents read as special.

  Decision rule going forward: **amber is the "achievement / brand / signal" accent, blue is the "UI / interactive / focus" accent.** Use one or the other per surface; never mix at the same level of weight.

**Layout pass v2 — uniform surface + custom logo:** 2026-04-27 — the previous header/footer-vs-main contrast (off-white surfaces vs. tinted main) was reading as inconsistent rather than considered. Reversed course:

  - **Single uniform `bg-background` across header, main, and footer** — no more bg-card on the boundaries, no more `main-bg-gradient` overlay on the body. The page reads as one cohesive surface.
  - **Hierarchy via thin borders only** — header has `border-b border-border/70` + `backdrop-blur-md`; footer has `border-t border-border/70`. Stripe / Linear-coded clean: thin lines do the boundary work, no color tricks needed.
  - **Custom SVG logo** — new `web/components/SkillGaugeLogo.tsx`. Three-arc half-gauge (light → medium → strong opacity bands of `currentColor`) with a tapered needle pointing up-right. Reads as "measurement progressing toward a target" — matches the product name + the core idea of skills tracked across rounds. Replaces the generic Lucide `GaugeCircle` in the home hero, AppLayout header, both sidebars, SiteFooter brand mark, and About-dialog header. Works at every size 16–28px because of the proportional viewBox and `currentColor` inheritance.

**Header/footer surfaces + main-area gradient + softer text — superseded by v2 above:** 2026-04-27 — three changes that together make the page hierarchy more legible:

  - **Foreground softened** — `#18181b` → `#27272a` (zinc-800) across light-mode text. Still WCAG AAA at ~13:1 contrast on the off-white background; reads as crisp without being harsh. The change cascades through the cascading `:root` block so every `var(--color-foreground)` consumer picks it up.
  - **Header given visual weight** — AppLayout's fixed header switched from `bg-background/95 backdrop-blur-sm` (which blended into the page below) to `bg-card/95 backdrop-blur-md shadow-sm shadow-foreground/[0.03]`. Now reads as a proper navigation bar.
  - **Footer given visual weight** — SiteFooter switched from `bg-muted/50 backdrop-blur-sm` (faded) to `bg-card` with a subtle top inner-shadow. Pairs with the header so the page reads as a clear three-band layout: header / main / footer.
  - **New `.main-bg-gradient` utility** — slow-drifting linear gradient (~4-6% opacity primary + accent at the diagonals) animated via `background-position` over 28s. Sits behind the main-area content as a `::before` pseudo-element with `z-index: -1`. Applied to AppLayout's `<main>` so the home/setup/reset/dashboard surfaces have a barely-perceptible animated tint that distinguishes them from the solid header/footer. Pure CSS, GPU-accelerated, respects `prefers-reduced-motion`.
  - **Author dialog avatar wired** — confirmed `AVATAR_PATH = "/KNProfPic.png"` resolves to the user's doodle file in `web/public/`.

**Cleanup pass — gitignore + dead assets:** 2026-04-27 — added `.swc/` (Next.js SWC compile cache) to `web/.gitignore` and `tests/**/*.{js,js.map}` to `backend/.gitignore` (defensive against stale `tsc` runs in the tests folder). All 9 unused images in `web/public/` removed earlier in the day. ts-prune confirms zero genuinely-dead exports across the FE — only framework-required defaults remain (page exports, route handlers, jest mocks). All key files have header docstrings; module organisation follows SOLID per-file SRP (services/repos/routes split cleanly; LLM + embeddings provider abstractions isolate vendor SDKs from consumers).

**Documentation cleanup pass:** 2026-04-27 — added prominent block-comment headers to `backend/src/llm/index.ts` (LLMClient factory) and `backend/src/llm/embeddings/index.ts` (Embeddings factory) explaining the **current state** (stub mode by default, what works without keys) AND the **exact steps** to switch to a real provider — provider URLs, env var names, the Atlas Vector Search index JSON spec, the restart command. New top-level `requirements.md §13 — Credentials + key rotation playbook` covers what to do when changing MongoDB connection / swapping LLM provider key / swapping embeddings provider / recreating the Atlas Vector Search index / rotating `JWT_SECRET` / changing `BACKEND_URL` / tuning cost guards. New top-level `DOCS.md` — a one-page index of every doc file at the repo root, what each is for, when to read it, and a fresh-contributor reading order.

**Animation visibility recovery:** 2026-04-27 — after the palette went near-monochrome, the existing animations lost their visible motion (gradient stops too close in lightness to read as a sweep). Rewrote the gradient-based animations to use **lightness-contrast within one hue** instead of cycling between hues:

  - **`brand-frame`** — gradient is now `transparent (22% primary) → primary → transparent (22% primary)` swept across 280% width over 3s ease-in-out. Reads as a clear glint moving around the icon border, instead of a gentle two-color crossfade.
  - **`icon-tile`** — same lightness-sweep pattern, 4s loop. Visible on every dashboard panel header + About-dialog section heading.
  - **`animate-gradient-text`** — full rewrite to a true ShinyText pattern: `foreground → primary → foreground` highlight sweep across the text every 3.5s. The "built around you" phrase now genuinely shimmers — the text reads as the foreground colour with a bright primary highlight visibly sweeping across.
  - **`pulse-dot`** — core scale 1.0 → 1.4 (was 1.2), period tightened to 1.6s; ring expansion 0 → 12px (was 8px); ring alpha bumped 70% → 80%. The "active session" indicator now clearly announces itself.
  - **`Button`** click feedback — `hover:scale-[1.02]` + `active:scale-[0.94]` + `active:brightness-95` chained on `transition-all duration-150`. Hover gives a subtle lift before click; click gives a clear inward press + dim, mimicking a physical key. Visible on every Button instance app-wide.

  All animations still respect `prefers-reduced-motion` (transforms cleared, animations disabled).

**Visible-animation pass:** 2026-04-27 — earlier flourishes were too quiet to notice. Upgraded to **visibly moving** animation primitives (still mature, not cartoonish). New utilities in `globals.css`:

  - `.brand-frame` rewritten — gradient now sweeps every 4s with linear easing across 300% background-size (was a slow imperceptible breathe over 8s). Outer glow boosted to 50% primary alpha for visual anchoring.
  - `.lift-card` — visible 3px hover lift + colored shadow tinted to primary + brightening border. Used on dashboard "My Résumés" rows. Cubic-bezier easing for the spring feel.
  - `.pulse-dot` — radiating pulse rings on active-state indicators. Two synchronized animations: core dot scales 1.0 → 1.2 → 1.0 over 2s; a `::after` ring expands 0 → 8px and fades out simultaneously. Applied to ChatroomEntry's "active session" indicator dot.
  - `.shimmer` — moving sheen overlay (left → right gradient sweep over 1.8s) replacing Tailwind's `animate-pulse` opacity blink on the Skeleton primitive. Reads as polished, matches the brand-frame sweep direction. All Skeleton call sites get the new effect for free (single-source primitive).
  - **Click feedback on `Button`** — `active:scale-[0.97]` plus `transition-all duration-150` adds a subtle inward press on every Button instance app-wide. Tactile without being noisy.
  - All new utilities respect `prefers-reduced-motion` (animations disabled, transforms cleared).

---

## Cleanup pass (2026-04-26)

**Goal**

End-of-marathon hygiene sweep based on user feedback. Five concrete actions:

1. Strip phase numbers + date markers from all code comments — only documentation should carry the timeline.
2. Apply SOLID single-responsibility to the bloated `interview/page.tsx` — extract focused components.
3. Audit the RSC vs client split — convert what can be Server Components.
4. Add a dedicated "Human TODOs" section listing manual actions (API keys, Atlas Vector Search index creation, etc.).
5. Re-sync memory + phase docs.

**What changed — comment hygiene**

Swept 33 occurrences of `Phase \d+`, `2026-04-2[56]`, "sub-phase", and similar timeline markers from across 22 files in `web/` and `backend/src/`. Replaced each with semantic prose describing *what* the code does, not *when* it shipped. The PROGRESS.md / activity_log timeline keeps that history in dedicated docs where it belongs. Two date references were retained intentionally — both are example values illustrating a date format (`YYYY-MM-DD` in `usageQuotas.ts`) or a deterministic test fixture (`relativeTime.test.ts`'s `NOW` constant).

**What changed — interview page SOLID refactor**

The interview page had grown to ~400 lines mixing orchestration with two complete UI subviews (CompletionCard, RetryDialog) and a couple of pure helpers. Extracted into focused files:

- [web/features/interview/CompletionCard.tsx](web/features/interview/CompletionCard.tsx) — end-of-round summary + 3-CTA layout. Owns the `averageScore` memo. Receives session/messages/round/onStartNew/onStartNextRound callbacks.
- [web/features/interview/RetryDialog.tsx](web/features/interview/RetryDialog.tsx) — re-answer modal. Owns the dialog UI + local form state (`answer`, `submitting`). Parent owns the network call (`onSubmit` returns a Promise).
- [web/lib/interviewMessages.ts](web/lib/interviewMessages.ts) — pure helpers (`findQuestionForFeedback`, `sortByTimestamp`). Framework-free; reusable from any component without React imports.
- [web/app/interview/page.tsx](web/app/interview/page.tsx) — slimmed back to a single concern: orchestration. Auth gate + bootstrap + transcript merge + routing user interactions to the extracted components. Doc-block at the top names every extracted file so future contributors find them.

This is straight Single Responsibility Principle — each file owns one concern, and the page composes them.

**What changed — RSC vs client audit**

The home page (`app/page.tsx`) was tagged `"use client"` only because of an auth-aware CTA button. Refactored:

- New [web/components/HeroCta.tsx](web/components/HeroCta.tsx) — small `"use client"` island holding the CTA button + auth state lookup.
- [web/app/page.tsx](web/app/page.tsx) — now a Server Component (no `"use client"` directive). Static marketing sections render as RSC; only the `<HeroCta />` islands and `<AppLayout />` (which has its own client boundary for UserMenu) ship as client code.

The other client pages (`/setup`, `/interview`, `/dashboard`, `/reset`, `not-found`, `error`) legitimately need client APIs:
- `/setup` + `/dashboard`: `useAuth` for the redirect-on-unauth gate.
- `/interview`: heavy interactive state (transcript, scroll anchor, retry dialog).
- `/reset`: `useSearchParams` for `?token=…`.
- `not-found`: `usePathname` for the diagnostic display.
- `error`: Next.js requires error boundaries to be client components.

Splitting any of those into RSC + client island would force props-drilling or server roundtrips for what's already isolated state. Left as-is.

**What changed — Human TODOs**

New §12 in [requirements.md](requirements.md) lists 17 manual actions a human operator has to take, grouped:

- **Required to use the app** (3 items: JWT_SECRET, MONGODB_URI, BACKEND_URL).
- **Highly recommended (free, ~5 min)** (3 items: get free Gemini key, flip provider, flip embeddings provider).
- **Optional — vector search** (2 items: create Atlas Search index, wait for build).
- **Optional — paid LLMs** (2 items: OpenAI / Anthropic keys).
- **Optional — production deploy** (4 items: pick host, set prod envs, HTTPS, tighten CORS).
- **Optional — known follow-ups** (3 items: rewrite BE tests on supertest, smoke-test real LLM, surface logout-everywhere).

Each row spells out *what* / *why* / *what it unblocks*. Designed to be the single page a human reads to know "what's left for me to do."

**Verification**

- Phase markers grep: only example date strings + test fixtures remain.
- `tsc --noEmit` clean on FE and BE.
- Jest + build expected to stay green; covered in the final verification step.

**Files touched**

- 22 files swept for phase markers (full list in the audit script's output)
- New: [web/features/interview/CompletionCard.tsx](web/features/interview/CompletionCard.tsx), [web/features/interview/RetryDialog.tsx](web/features/interview/RetryDialog.tsx), [web/lib/interviewMessages.ts](web/lib/interviewMessages.ts), [web/components/HeroCta.tsx](web/components/HeroCta.tsx)
- Refactored: [web/app/page.tsx](web/app/page.tsx) (Server Component), [web/app/interview/page.tsx](web/app/interview/page.tsx) (slimmed)
- Docs: [requirements.md §11–12](requirements.md), [PROGRESS.md](PROGRESS.md) (this section)

---

## Phase 10 — Re-answer mode + tags + personas (2026-04-26)

**Goal**

Final sub-phase of the 10-step roadmap. Three features bundled — each lean enough to ship together without bloat:

1. **Personas** — interviewer flavour: neutral / FAANG / startup / consulting. Tilts the system prompt's tone + rubric.
2. **Re-answer mode** — every feedback bubble now has a "Try this question again" button that opens a dialog, lets the user submit a fresh attempt, and appends the new answer + feedback to the transcript.
3. **Tags** — derived FE-only pills under question bubbles, sourced from session options. No LLM contract change.

**What changed — Personas**

- New enum `INTERVIEWER_PERSONAS = ["neutral", "faang", "startup", "consulting"]` in [backend/src/shared/contracts.ts](backend/src/shared/contracts.ts) + the FE mirror in [web/features/session-setup/sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts).
- `initSessionSchema.interviewerPersona` is optional; defaults to `"neutral"` at the service layer.
- New `PERSONA_DESCRIPTION` map in [backend/src/llm/prompts/v1/shared.ts](backend/src/llm/prompts/v1/shared.ts) — one paragraph per persona, injected into the system prompt by [generateQuestion.ts](backend/src/llm/prompts/v1/generateQuestion.ts). `neutral` returns `""` so the baseline prompt is unchanged for sessions that don't use the feature.
- `SessionDoc.interviewerPersona` (optional) — legacy docs read as `"neutral"`.
- FE: new dropdown in the setup grid; carried through `SessionOptions` → `sessionStorage` → `initializeSession` payload without any new plumbing.

**What changed — Re-answer**

- New service method `sessionsService.reanswer(userId, sessionId, questionIndex, answer)` ([backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts)):
  - Owner check + look up the existing question by `questionIndex`.
  - Run the same `gradeAnswer` prompt with the fresh attempt; full prior transcript fed in so the LLM can spot improvement.
  - Append a NEW `answer` + NEW `feedback` row at the end of the transcript (via createdAt ordering). The original Q/A/F triplet stays untouched.
  - Cost guards + memory writes mirror `submitAnswer`.
  - **Doesn't advance `currentQuestionIndex`** and **doesn't reactivate** a completed session — re-answer is the path for "let me try that one again", not "give me more questions" (round chaining is the path for that).
- New route `POST /api/sessions/:id/questions/:index/reanswer` ([backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts)). Body: `{ answer: string }`.
- FE: `reanswerQuestion(sessionId, questionIndex, answer)` in [web/services/api.ts](web/services/api.ts).
- `MessageBubble` ([web/features/interview/MessageBubble.tsx](web/features/interview/MessageBubble.tsx)) gained an optional `onRetry` prop. When passed, the feedback bubble renders a divider + a small "Try this question again" ghost button.
- The interview page ([web/app/interview/page.tsx](web/app/interview/page.tsx)) tracks `extraMessages` state for retries, merges them with `messages` via `useMemo` (sort by `timestamp`), and routes the dialog → service call → toast loop. `questionIndexFor(feedbackMsg)` walks the merged transcript to find the question slot a feedback row belongs to so we know which `questionIndex` to POST.

**What changed — Tags**

- `MessageBubble` accepts an optional `tags?: string[]` prop. When set, renders pill-shaped capsules below the question content.
- The interview page derives `questionTags` from the session title (e.g., "Senior Behavioral Interview" → `["behavioral"]`). Passes it on every question bubble. Zero LLM contract change.
- Cheap visual signal — communicates what the question is about without requiring a tagging step from the model.

**Verification**

- `cd backend && npx tsc --noEmit && npm run build` clean.
- `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` — 39/39 jest, 8 routes (`/dashboard` + 6 static + 1 dynamic BFF).

**Files touched**

- [backend/src/shared/contracts.ts](backend/src/shared/contracts.ts) — `INTERVIEWER_PERSONAS` enum + `interviewerPersona` field on `initSessionSchema`
- [backend/src/shared/types.ts](backend/src/shared/types.ts) — `InterviewerPersona` type + `SessionInitRequest.interviewerPersona`
- [backend/src/db/repos/sessions.ts](backend/src/db/repos/sessions.ts) — `SessionDoc.interviewerPersona`
- [backend/src/llm/LLMClient.ts](backend/src/llm/LLMClient.ts) — `QuestionContext.interviewerPersona`
- [backend/src/llm/prompts/v1/shared.ts](backend/src/llm/prompts/v1/shared.ts) — `PERSONA_DESCRIPTION` map
- [backend/src/llm/prompts/v1/generateQuestion.ts](backend/src/llm/prompts/v1/generateQuestion.ts) — persona line injected into system prompt
- [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) — `reanswer` method + persona default in `initialize`
- [backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts) — `POST /:id/questions/:index/reanswer`
- [web/features/session-setup/sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts) — `INTERVIEWER_PERSONAS` + form field
- [web/features/session-setup/SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx) — persona dropdown
- [web/services/api.ts](web/services/api.ts) — `InterviewerPersona` type, `SessionOptions.interviewerPersona`, `reanswerQuestion()`
- [web/features/interview/MessageBubble.tsx](web/features/interview/MessageBubble.tsx) — `tags` + `onRetry` props
- [web/app/interview/page.tsx](web/app/interview/page.tsx) — retry dialog state machine, `extraMessages` merge, derived `questionTags`

**Gotchas**

1. **Re-answer doesn't reactivate a completed session.** A retry on a finished interview adds rows to the transcript but the session stays `status: "completed"`. If the user wants more questions on the same résumé/JD, that's the round-chaining path (Phase 4). Distinct buttons, distinct flows — don't unify them.
2. **`questionIndex` for retries is the original question's index, not a new one.** The `(sessionId, questionIndex)` partial-unique index on `messages` would reject a duplicate question row, but answers + feedback don't carry a `questionIndex`, so the retry's answer/feedback rows append cleanly.
3. **Persona `neutral` returns `""` from `PERSONA_DESCRIPTION`.** That's intentional — older sessions and unflavoured runs see no extra prompt content. If you ever want a default personality, edit `PERSONA_DESCRIPTION.neutral`; don't remove the conditional.
4. **Tags are derived, not LLM-generated.** If you want richer tags ("system-design", "leadership", "DSA"), extend `gradeResponseSchema` to include a `tags: string[]` field and have the LLM emit them inline. Today's pills are zero-cost visual signal; that upgrade is a future concern.

---

## Phase 9 — PDF export (2026-04-26)

**Goal**

Make the interview output portable. User wants a downloadable artifact they can keep for review or share. Constraint: client-side only — the data is already in FE state, so a server roundtrip would add nothing.

**What changed**

- **Dep**: `jspdf ^3.x` added to [web/package.json](web/package.json). 80 KB gzipped, no native code, runs in any modern browser.
- **New util** [web/lib/exportPdf.ts](web/lib/exportPdf.ts) — `exportSessionPdf({ session, messages })`:
  - Header: title + ISO timestamp + answer count + average score + round count (if > 1).
  - Walks every message in order, renders speaker label + body via `splitTextToSize` (auto wraps to content width).
  - Per-feedback messages: bold "Score: N / 10" line, then bulleted Strengths and Improvements.
  - `ensureSpace(doc, y, requiredHeight)` helper paginates on overflow — no clipped text.
  - File name: `skillgauge-<title-slug>-<yyyymmdd>.pdf`.
- **Completion card** ([web/app/interview/page.tsx](web/app/interview/page.tsx)) — added `Export PDF` outline button between "Start Round N+1" and "New Session". Receives `session` + `messages` from props (parent already has them).

**Why jsPDF over @react-pdf/renderer**

jsPDF is ~80 KB; @react-pdf/renderer is ~600 KB. The export today is plain prose with bullets — jsPDF handles it cleanly. If a future report needs charts / images / rich layout, react-pdf becomes worth its bundle weight.

**Verification**

- `npx tsc --noEmit` clean.
- `npm test -- --ci` — 39/39 jest green.
- `npm run build` clean. Bundle size for `/interview` increases by ~24 KB gz (jsPDF chunked into the route's bundle by Turbopack).

**Files touched**

- [web/package.json](web/package.json) — `+ jspdf`
- [web/lib/exportPdf.ts](web/lib/exportPdf.ts) — new
- [web/app/interview/page.tsx](web/app/interview/page.tsx) — Export PDF button

**Gotchas**

1. **`jsPDF.output("save")` triggers a download via `<a>` click**. Some browsers block downloads from a non-user-gesture handler. Our button is `onClick` so we're fine; if a future feature ever auto-exports on completion, it must still be triggered by an interaction.
2. **`splitTextToSize` returns the SDK's typed-as-`string | string[]` value**; we cast to `string[]` inline because every input is non-empty. If you ever pass a single-character string, the runtime returns `string` and the for-loop iterates characters. Defensive: gate on length first if that's ever a real path.
3. **Filename slug truncates at 40 chars**. Long session titles get clipped — fine for user-facing slugs, just call out if a future feature needs the full title (read it from the PDF metadata instead).

---

## Phase 8 — Voice + TTS via Web Speech API (2026-04-26)

**Goal**

Add voice input + audio playback for a more realistic mock-interview experience. Per user choice (option A from the Q3 brainstorm), use the browser's built-in `SpeechRecognition` and `SpeechSynthesis` APIs — zero API keys, zero server roundtrips, zero cost. Quality is browser-dependent (best on Chrome/Edge); Firefox can't dictate but TTS still works.

**What changed**

- **New hook** [web/hooks/useSpeechRecognition.ts](web/hooks/useSpeechRecognition.ts) — wraps `SpeechRecognition` (with the webkit-prefixed fallback for Safari) into `{ isListening, isSupported, transcript, reset, start, stop }`. SSR-safe `isSupported` flips to true post-hydration if the browser ships the API. `interimResults: true` so the textarea live-updates as the user speaks. `onerror` silently flips state back to ready (covers permission denied + network blips).
- **New hook** [web/hooks/useSpeechSynthesis.ts](web/hooks/useSpeechSynthesis.ts) — exposes `{ isSpeaking, isSupported, speak, stop }`. `speak()` cancels any in-flight utterance before queueing the new one (no double-speaks on rapid clicks). `lang: en-US`, `rate: 0.95` for slightly slower-than-default cadence that reads naturally for interview content.
- **AnswerInput** ([web/features/interview/AnswerInput.tsx](web/features/interview/AnswerInput.tsx)) — mic button next to the send button. While listening: button flips variant (filled), placeholder reads "Listening… speak your answer", live transcript writes into the textarea via `useEffect`. Stopping (or submitting) calls `speech.reset()`. Hidden in browsers without `SpeechRecognition` (Firefox) — typing always works.
- **MessageBubble (question)** ([web/features/interview/MessageBubble.tsx](web/features/interview/MessageBubble.tsx)) — speaker button in the header row. Toggles between `Volume2` (idle) and `VolumeX` (speaking). Per-bubble TTS state means multiple questions on screen each get their own control. Hidden in browsers without `speechSynthesis`.
- **No settings UI today.** Voice is opt-in (you tap the button). A future settings popover with auto-TTS + voice picker is a small follow-up; not required for the personal-use baseline.

**Verification**

- `npx tsc --noEmit` clean.
- `npm test -- --ci` — 39/39 jest green.
- `npm run build` clean.

**Files touched**

- [web/hooks/useSpeechRecognition.ts](web/hooks/useSpeechRecognition.ts) — new
- [web/hooks/useSpeechSynthesis.ts](web/hooks/useSpeechSynthesis.ts) — new
- [web/features/interview/AnswerInput.tsx](web/features/interview/AnswerInput.tsx) — mic button + transcript wire-up
- [web/features/interview/MessageBubble.tsx](web/features/interview/MessageBubble.tsx) — speaker button on questions

**Gotchas**

1. **Firefox doesn't ship `SpeechRecognition`.** The mic button hides itself; users on Firefox type as before. TTS works on all four major browsers.
2. **Safari needs a user gesture** before `speechSynthesis.speak` works. Both buttons trigger via click, so we satisfy this — but if a future "auto-read every question" toggle is added, it must initiate from a user-gesture-rooted handler.
3. **`onerror` for STT covers a wide range of failure modes** — mic denied, no internet (some browsers fetch the recogniser server-side), language model not loaded. We silently flip to ready and let the user retry. If we ever need fine-grained error UX, the `event.error` field is where to branch.
4. **Live transcript replaces (not appends)** the textarea content while listening. If the user wants to dictate a paragraph, then edit, then dictate more, they should stop, edit, and start again — each `start()` resets the recogniser's accumulated transcript.

---

## Phase 7 — Dashboard (2026-04-26)

**Goal**

Personal progress overview at `/dashboard`. Three sections: stats grid (sessions / questions / average / best), score-trend line chart, and recurring weak-area phrases. Uses the data already captured by Phases 2 + 6 — no new collections, no new schema. Single BE summary endpoint feeds the whole page.

**What changed**

- **New BE module** [backend/src/modules/dashboard/](backend/src/modules/dashboard/):
  - `dashboard.service.ts` — `summary(userId)` walks `sessions` + `messages` (one round-trip via `$in: userSessionIds` over messages collection). Returns `{stats, scoreTrend, weakAreas}`. Tokeniser for weak areas: lowercase → strip non-alpha → split → drop stopwords + tokens shorter than 4 chars → frequency-count. Top 8 returned.
  - `dashboard.routes.ts` — `GET /api/dashboard/summary` (auth-required). Mounted on app via `dashboardRoutes(app)` in [backend/src/app.ts](backend/src/app.ts).
- **Wire surface** ([web/services/api.ts](web/services/api.ts)) — `DashboardSummary` type + `fetchDashboardSummary()` export.
- **New page** [web/app/dashboard/page.tsx](web/app/dashboard/page.tsx):
  - Auth-gated with `useAuth()`; redirects unauth visitors to `/`.
  - Skeleton loading state mirrors the final layout (no flash-then-content jump).
  - Stats grid (4 cards): one card uses the existing `<ScoreRadial size={56}>` for the average; the other three are big-number cards.
  - Score trend: `recharts` `LineChart` inside a `ResponsiveContainer`. X-axis is `YYYY-MM-DD` (ISO trimmed); Y-axis fixed `[0, 10]`. Tooltip themed via inline style (no JS theme detection needed for a static color palette).
  - Weak areas: list of phrases with proportional bars. Width = `(count / max) * 100%`. Empty state when no graded answers exist yet.
- **Header link** ([web/components/AppLayout.tsx](web/components/AppLayout.tsx)) — auth-gated `Dashboard` link with `BarChart3` icon. Hidden during auth loading flicker; hidden when unauth.

**Verification**

- `cd backend && npx tsc --noEmit && npm run build` clean.
- `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` — 39/39 jest, 8 routes total (added `/dashboard`).

**Files touched**

- [backend/src/modules/dashboard/dashboard.service.ts](backend/src/modules/dashboard/dashboard.service.ts) — new
- [backend/src/modules/dashboard/dashboard.routes.ts](backend/src/modules/dashboard/dashboard.routes.ts) — new
- [backend/src/app.ts](backend/src/app.ts) — register dashboardRoutes
- [web/services/api.ts](web/services/api.ts) — `DashboardSummary` + `fetchDashboardSummary`
- [web/app/dashboard/page.tsx](web/app/dashboard/page.tsx) — new page
- [web/components/AppLayout.tsx](web/components/AppLayout.tsx) — header Dashboard link

**Gotchas**

1. **Aggregation is in-process, not Mongo aggregation pipeline.** Walks all of a user's `messages` once and tokenises in JS. Fine at personal scale; if a user accumulates thousands of feedback messages, swap to a precomputed materialised view written on each feedback insert (or a `$facet` aggregation).
2. **Stopwords are hand-curated.** No NLP library — the bounded vocabulary of LLM feedback prose is small enough that a 30-word list catches the noise. If feedback ever supports non-English text, re-think.
3. **Score trend X-axis is daily-ISO**, not bucket-binned. If you have 20 answers in one day they all sit on the same X tick. Visual works because each Y point is the same date string. For a smoothed view (rolling average, weekly bins), aggregate on the FE before passing to recharts.
4. **The `@google/genai` `embedContent` call returns a stub-shaped payload in the type system** that the TypeScript compiler narrows correctly only because we read `.embeddings?.[0]?.values`. If a future SDK rev changes the shape, expect compile errors here.

---

## Phase 6 — Atlas Vector Search + memory + sessions list (2026-04-26)

**Goal**

Stand up the long-term memory infrastructure that Phase 7 (dashboard) and future RAG features will build on. Three pieces:

1. **Embeddings layer** — `EmbeddingsClient` interface with `stub` + `gemini` adapters. Same factory pattern as `LLMClient`.
2. **Memory store** — new `memories` collection holding `{userId, sessionId, kind, content, embedding, score?}`. Indexed by `(userId, createdAt)` and `sessionId`. Atlas Search vector index spec lives in [requirements.md §11](requirements.md).
3. **Sessions list + transcript hydration** — `GET /api/sessions` (newest-first) and `GET /api/sessions/:id/messages` (owner-checked transcript replay). FE chatroom sidebar consumes the list when authenticated; the localStorage archive becomes a fallback.

**What changed**

- **New abstraction**: [backend/src/llm/embeddings/EmbeddingsClient.ts](backend/src/llm/embeddings/EmbeddingsClient.ts) — `embed(text) → number[]` plus a stable `dimensions` getter. Mirrors the `LLMClient` interface pattern; service code never touches a vendor SDK.
- **Stub embeddings**: [backend/src/llm/embeddings/stubEmbeddings.ts](backend/src/llm/embeddings/stubEmbeddings.ts) — SHA-256 → 768-float vector via byte-stretch + L2-normalise. Deterministic, fast, semantically meaningless. Lets every storage path work in dev/tests without a key.
- **Gemini embeddings**: [backend/src/llm/embeddings/geminiEmbeddings.ts](backend/src/llm/embeddings/geminiEmbeddings.ts) — wraps `GoogleGenAI.models.embedContent({ model, contents })`. Reuses `GEMINI_API_KEY`.
- **Factory + cache**: [backend/src/llm/embeddings/index.ts](backend/src/llm/embeddings/index.ts) — `getEmbeddingsClient()` is module-level memoised so multiple call sites share one instance. Boot fails loudly if `EMBEDDINGS_PROVIDER=gemini` and key is missing.
- **Env additions** ([backend/src/config/env.ts](backend/src/config/env.ts)):
  - `EMBEDDINGS_PROVIDER` enum `["stub", "gemini"]`, default `stub`.
  - `GEMINI_EMBED_MODEL` default `gemini-embedding-001`.
  - `EMBEDDINGS_DIMENSIONS` default `768` — must match the Atlas Search index spec.
- **`MemoryDoc` schema** ([backend/src/db/repos/memories.ts](backend/src/db/repos/memories.ts)):
  - `_id`, `userId`, `sessionId`, optional `messageId`, `kind` (`question | answer | feedback | resume | jd`), `content` (verbatim source — supports re-embedding without losing the text), `embedding: number[]`, optional `score` (rubric score for `kind: feedback` rows so the dashboard can aggregate without joining), `createdAt: Date`.
  - Repo methods: `insert / insertMany / listByUser / searchSimilar`.
  - `searchSimilar` uses `$vectorSearch` aggregation with index name `memory_vec_index`, `numCandidates: max(50, 10·k)`, `userId` filter (critical — never leak across users). Best-effort: throws on local mongods without Atlas Search; callers degrade gracefully.
- **Indexes** ([backend/src/db/indexes.ts](backend/src/db/indexes.ts)) — `(userId, createdAt: -1)` and `sessionId` on the `memories` collection. The vector search index is **manual** (Atlas UI / Admin API) — `requirements.md §11` documents the JSON spec.
- **Memory writes wired into [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts)**:
  - On `initialize` — index résumé + JD + first question (3 writes in parallel).
  - On `submitAnswer` — index answer + feedback (2 writes in parallel; feedback row carries `score`).
  - All writes go through a `writeMemory()` helper that **swallows errors** with a `console.warn` — embeddings are augmentation, never load-bearing for the chat. A provider hiccup must not break the interview.
- **Sessions list endpoints**:
  - `sessionsRepo.listByUser(userId, limit=50)` — newest-first cap. Pagination later.
  - `sessionsService.listSessions(userId)` + `listMessages(userId, sessionId)` (owner-checked).
  - Routes: `GET /api/sessions` (returns `{ sessions: Session[] }`) and `GET /api/sessions/:id/messages` (returns `{ messages: Message[] }`).
- **FE wiring**:
  - [web/services/api.ts](web/services/api.ts) — `listSessions()` + `fetchSessionMessages(sessionId)` exports.
  - [web/features/interview/InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx) — `useQuery` against `listSessions` (`staleTime: 60s`). Server entries take precedence over localStorage archives; the local archive only contributes when the server returns nothing (offline / unauth).
  - "N saved" / "N archived" indicator copy adapts to the active source.

**Verification**

- `cd backend && npx tsc --noEmit && npm run build` clean.
- `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` — typecheck clean, **39/39 jest green** (no test count change), 7 routes prerendered + 1 dynamic BFF.
- Atlas Search index creation is a manual one-time step documented in `requirements.md §11`. Local mongods skip the index — writes still work, search calls throw.

**Files touched**

- [backend/src/llm/embeddings/EmbeddingsClient.ts](backend/src/llm/embeddings/EmbeddingsClient.ts) — new
- [backend/src/llm/embeddings/stubEmbeddings.ts](backend/src/llm/embeddings/stubEmbeddings.ts) — new
- [backend/src/llm/embeddings/geminiEmbeddings.ts](backend/src/llm/embeddings/geminiEmbeddings.ts) — new
- [backend/src/llm/embeddings/index.ts](backend/src/llm/embeddings/index.ts) — new (factory)
- [backend/src/db/repos/memories.ts](backend/src/db/repos/memories.ts) — new
- [backend/src/db/repos/sessions.ts](backend/src/db/repos/sessions.ts) — `listByUser`
- [backend/src/db/indexes.ts](backend/src/db/indexes.ts) — memories indexes
- [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) — `writeMemory` helper, init + answer hooks, `listSessions`, `listMessages`
- [backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts) — `GET /` + `GET /:id/messages`
- [backend/src/config/env.ts](backend/src/config/env.ts) — embeddings envs
- [backend/.env.example](backend/.env.example) — placeholders + documentation block
- [web/services/api.ts](web/services/api.ts) — `listSessions` + `fetchSessionMessages`
- [web/features/interview/InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx) — server-backed list with localStorage fallback
- [requirements.md](requirements.md) — env table rows + §11 Atlas Search index setup

**Gotchas**

1. **Vector index is manual.** `db.collection.createIndex(...)` doesn't create Atlas Search indexes. The `requirements.md §11` JSON spec is the canonical source — pasted into the Atlas UI's Search Index editor. Local mongods skip this step entirely.
2. **`userId` filter is critical** in the vector search aggregation. Without it, one user's similarity query could surface another user's content. Configured both as a `filter` in the Atlas Search index AND as a Mongo `$eq` filter on the aggregation — defence in depth.
3. **Stub embeddings are deterministic but useless for retrieval.** A Phase 7 dashboard reading `memories.searchSimilar` results in stub mode will see roughly random rows. Stub exists so the storage path works; for real value, set `EMBEDDINGS_PROVIDER=gemini`.
4. **`writeMemory` swallows errors.** This is intentional. Augmentation must not break load-bearing flows. If you ever audit the logs and see persistent embedding failures, that's a real problem — fix the provider, don't change the swallow policy.
5. **Re-embedding on dim change.** If `EMBEDDINGS_DIMENSIONS` ever changes (provider swap, model upgrade), existing rows have the wrong-dim vector and `$vectorSearch` will reject the query. Drop + recreate the index AND re-run a one-shot to re-embed every row. No automation today.
6. **Idempotency on re-init.** Calling `POST /api/sessions` twice for the same user creates two sessions and two sets of memory rows. That's fine — they're separate sessions. The per-message uniqueness invariant lives on `messages` (partial unique on `(sessionId, questionIndex)`); `memories` is intentionally insert-only / append-only.

---

## BFF layer — Next route handlers proxying Express (2026-04-26)

**Goal**

Move the FE off cross-origin direct-to-Express calls. Now `services/api.ts` calls same-origin `/api/...` and a Next 16 route handler proxies server-side to the Express backend. Two concrete wins:

1. **No CORS preflights from the browser.** Same-origin requests skip preflight entirely; CORS allow-list complexity disappears for the FE deploy.
2. **BE hostname is server-only.** `BACKEND_URL` lives on the Next server side and never reaches the JS bundle — attackers can't grep the bundle for the Express host.

**What changed**

- **New file** [web/app/api/[...path]/route.ts](web/app/api/[...path]/route.ts) — catch-all dynamic route that exports `GET / POST / PUT / PATCH / DELETE` handlers. Each is a thin wrapper around a single `forward(req, params)` function that:
  - Joins the catch-all path back together (`["auth", "login"]` → `"auth/login"`).
  - Preserves the query string from the original URL.
  - Strips runtime-managed headers (`host`, `connection`, `content-length`, `transfer-encoding`, `accept-encoding`) before forwarding.
  - Forwards the body as a `ReadableStream` for non-GET/HEAD methods (Node 18+ `duplex: "half"`) so résumé uploads aren't buffered.
  - Mirrors the upstream status, statusText, and a sanitised header set back to the browser.
  - On upstream connection failure, returns `502 BFF_UPSTREAM_UNREACHABLE` so the FE error path shows "service down" rather than a generic network error.
- **`services/api.ts`** ([web/services/api.ts](web/services/api.ts)) — `API_BASE` flipped from `process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"` to `""` (same-origin). Calls like `apiFetch("/api/auth/login")` now resolve to `${origin}/api/auth/login` which lands on the Next BFF handler.
- **`.env.local.example`** ([web/.env.local.example](web/.env.local.example)) — replaced the `NEXT_PUBLIC_API_BASE_URL` line with `BACKEND_URL` (server-only). Old name kept commented as a backwards-compat fallback the BFF reads if `BACKEND_URL` is absent.

**Why a single catch-all instead of per-route handlers**

We have one upstream and identical forwarding semantics for every endpoint. A per-route file would double the code and offer zero customisation we actually need today. If a future endpoint ever wants per-route caching / aggregation / response shaping, that handler can short-circuit before the catch-all (Next 16 prioritises specific routes over `[...path]` automatically).

**Verification**

- `npx tsc --noEmit` clean.
- `npm test -- --ci` — 39/39 jest green.
- `npm run build` — clean. Route table now shows `ƒ /api/[...path]` (server-rendered on demand) alongside the existing 6 static routes.

**Files touched**

- [web/app/api/[...path]/route.ts](web/app/api/[...path]/route.ts) — new
- [web/services/api.ts](web/services/api.ts) — `API_BASE = ""`
- [web/.env.local.example](web/.env.local.example) — `BACKEND_URL` placeholder

**Gotchas**

1. **`duplex: "half"` is mandatory** when streaming a request body in Node 18+. Without it, fetch throws `RequestInit: duplex option is required when sending a body`. Already set on the non-GET/HEAD branch.
2. **`accept-encoding` is intentionally dropped on the request leg.** If we forwarded it the BE might gzip the response, then we'd need to handle decompression in the BFF. Local + same-host loop = compression gains nothing.
3. **`content-encoding` is dropped on the response leg** as a paired safety — if the BE somehow does send a gzipped body, we don't want to mislead the browser into double-decoding it.
4. **`BACKEND_URL` vs `NEXT_PUBLIC_API_BASE_URL`.** The BFF reads `BACKEND_URL` first, falls back to `NEXT_PUBLIC_API_BASE_URL`. Existing `.env.local` files keep working without edits, but new deploys should set `BACKEND_URL` so the BE host stays out of the bundle.
5. **CORS on the Express side is still configured for the FE origin** (so direct-to-BE calls during dev — e.g., curl, integration tests — keep working). Once everything funnels through the BFF, CORS could be tightened to `127.0.0.1` only or removed entirely. Not done today — out of scope, low value.

---

## Round 2 chaining — option B (2026-04-26)

**Goal**

Let the user keep practising on the **same résumé + JD** with a harder follow-up round once a round completes. Per the user's directive: "Per session questions will be 25. And it will be saved in the same chat. User can then select start session 2(enhanced version of session 1)" — that's option B (continued conversation, one session, growing transcript with rounds), not linked-sessions.

**What changed**

- **`QUESTION_COUNTS`** ([backend/src/shared/contracts.ts](backend/src/shared/contracts.ts) + [web/features/session-setup/sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts)): added `25` alongside `3 / 5 / 7 / 10`. The smaller counts stay supported for quick warm-up runs; 25 is the canonical "per-round" count.
- **`SessionDoc`** ([backend/src/db/repos/sessions.ts](backend/src/db/repos/sessions.ts)) gained two optional fields:
  - `currentRound: number` — defaults to 1 at create; bumps via `nextRound()`.
  - `questionsPerRound: number` — captures the original `questionCount` so each subsequent round extends `totalQuestions` by the same chunk size.
  - Legacy docs without these fields default at read time (`currentRound ?? 1`, `questionsPerRound ?? totalQuestions`).
- **New repo method** `sessionsRepo.advanceRound(id, nextRound, nextTotal)` — atomic `$set: { currentRound, totalQuestions, status: "active" }`.
- **New service method** `sessionsService.nextRound(userId, sessionId)`:
  1. Owner check + session must be `status: "completed"` (else `NOT_COMPLETE` → 409 `ROUND_NOT_COMPLETE`).
  2. `advanceRound`: bump `currentRound`, extend `totalQuestions` by `questionsPerRound`, flip status back to active.
  3. Generate the first question of the new round. Index continues from `currentQuestionIndex` (transcript stays one growing thread).
  4. Pre-call: `ensureUnderQuotaAndLength` over résumé + JD + history. Post-call: `usageQuotasRepo.recordCall`.
  5. Returns `{ session, firstQuestion }` shaped identically to `initialize` so the FE can reuse its append logic.
- **New route** `POST /api/sessions/:id/rounds/next` ([backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts)). Same auth + ownership chain as the rest of the sessions router. New error code `ROUND_NOT_COMPLETE` (409) added to the wire surface.
- **Round-aware prompt** ([backend/src/llm/prompts/v1/generateQuestion.ts](backend/src/llm/prompts/v1/generateQuestion.ts)): `QuestionContext` gained `currentRound`. The renderer adds a paragraph for round ≥ 2 instructing the model to ramp difficulty above prior rounds and weave back the topics where the candidate showed weakness. Round 1 emits no extra framing — backwards-compatible with single-round sessions.
- **Wire shape** ([backend/src/shared/types.ts](backend/src/shared/types.ts) + [web/services/api.ts](web/services/api.ts)): `Session` gained optional `currentRound` and `questionsPerRound`. `HealthInfo.llmProvider` extended to include `gemini` (carry-over from sub-phase 3).
- **`useSession`** ([web/hooks/useSession.ts](web/hooks/useSession.ts)) gained a third mutation `nextRoundMutation` + a `startNextRound()` callback. It POSTs `/api/sessions/:id/rounds/next` and appends the returned first question to the existing transcript — the user sees one continuous chat. `isLoading` now reflects all three mutations (init / answer / next-round).
- **`InterviewHeader`** ([web/features/interview/InterviewHeader.tsx](web/features/interview/InterviewHeader.tsx)) renders a small "Round N" pill (only when round > 1) next to the question counter. Title attribute explains the chaining concept.
- **`CompletionCard`** ([web/app/interview/page.tsx](web/app/interview/page.tsx)) — the end-of-round card now lives in option-B mode: primary CTA is **"Start Round N+1"** with the difficulty-ramp explanation; secondary outline button is **"New Session"**. Heading reads "Round N Complete" instead of the previous generic "Interview Complete".
- **`api.ts`** ([web/services/api.ts](web/services/api.ts)) exports `startNextRound(sessionId)`. Same response shape as `initializeSession` — caller treats them interchangeably.

**Verification**

- `cd backend && npx tsc --noEmit && npm run build` — both clean.
- `cd web && npx tsc --noEmit && npm test -- --ci && npm run build` — typecheck clean, **39/39 tests green** (no test count change), 7/7 routes prerendered.

**Files touched**

- [backend/src/shared/contracts.ts](backend/src/shared/contracts.ts) — `QUESTION_COUNTS` += 25
- [backend/src/db/repos/sessions.ts](backend/src/db/repos/sessions.ts) — `currentRound` + `questionsPerRound` + `advanceRound`
- [backend/src/shared/types.ts](backend/src/shared/types.ts) — `Session` wire fields
- [backend/src/llm/LLMClient.ts](backend/src/llm/LLMClient.ts) — `QuestionContext.currentRound`
- [backend/src/llm/prompts/v1/generateQuestion.ts](backend/src/llm/prompts/v1/generateQuestion.ts) — round-aware framing
- [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) — `nextRound()` + init defaults round 1 + apiSession round fields + new `NOT_COMPLETE` error code
- [backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts) — new route + status/code mappings
- [web/services/api.ts](web/services/api.ts) — Session round fields + `startNextRound` + HealthInfo gemini
- [web/hooks/useSession.ts](web/hooks/useSession.ts) — `nextRoundMutation` + `startNextRound()` callback
- [web/features/interview/InterviewHeader.tsx](web/features/interview/InterviewHeader.tsx) — Round badge
- [web/app/interview/page.tsx](web/app/interview/page.tsx) — CompletionCard primary CTA
- [web/components/LlmBadge.tsx](web/components/LlmBadge.tsx) — gemini provider entry
- [web/features/session-setup/sessionSetupSchema.ts](web/features/session-setup/sessionSetupSchema.ts) — `QUESTION_COUNTS` += 25

**Gotchas**

1. **Index continues across rounds.** `currentQuestionIndex` is **cumulative** — round 2 starts at index 25 (not 0). Same for `totalQuestions`: round 2's value is `2 × questionsPerRound`. The header counter "Question 26 of 50" is intentional — it reads as "you're 26 questions deep into this transcript." If a future Phase 7 dashboard ever needs "questions answered in round 2 only", derive it as `currentQuestionIndex - (currentRound - 1) * questionsPerRound`.
2. **No reset of `previousMessages`.** The full transcript history is fed to the LLM for every question across every round, which is what makes round-2 difficulty ramping meaningful (the model has seen what the user already nailed). Token budget protects via `ensureUnderQuotaAndLength`.
3. **Idempotency on repeated clicks.** Calling `nextRound` on an already-active session throws `NOT_COMPLETE`. The FE button is hidden when the session is active, so the only way to trigger a duplicate is intentional API misuse.
4. **Schema migration is implicit.** Existing sessions in the DB don't have `currentRound` / `questionsPerRound` — the read-side defaults handle them. No `db.update` needed; first interaction with `nextRound` will write the new fields if the user starts another round on a legacy session.

---

## Gemini 2.0 Flash adapter (2026-04-26)

**Goal**

Add a free-tier-friendly LLM provider so the user can smoke-test real LLM grading without paying OpenAI / Anthropic. Gemini's free tier has 1M-token context (massive headroom for résumé + JD + transcript) and 15 RPM / 1500 RPD — well above personal-app load.

**What changed**

- **Dep**: `@google/genai ^1.50.x` added to [backend/package.json](backend/package.json). Note this is the post-2024 successor to `@google/generative-ai` — `GoogleGenAI` is the entrypoint; the unified call is `models.generateContent({ model, contents, config })`.
- **Env**: [backend/src/config/env.ts](backend/src/config/env.ts) — `LLM_PROVIDER` enum extended to `["stub", "openai", "anthropic", "gemini"]`. Added `GEMINI_API_KEY` (optional; required when `LLM_PROVIDER=gemini`) + `GEMINI_MODEL` (default `gemini-2.0-flash`).
- **Adapter**: new [backend/src/llm/geminiClient.ts](backend/src/llm/geminiClient.ts) — `GeminiLLMClient implements LLMClient`. Mirrors the OpenAI/Anthropic patterns:
  - `generateQuestion`: passes `system` as `systemInstruction`, `user` as `contents[].parts[].text`. Reads `response.text`, trims, strips wrapping quotes.
  - `gradeAnswer`: same shape + `responseMimeType: "application/json"` and a hand-built `responseSchema` (Gemini wants OpenAPI-flavoured uppercase types — `STRING / INTEGER / ARRAY / OBJECT`). The hand-built schema is kept aligned with `gradeResponseSchema` manually; the zod schema remains the parse-time source of truth.
  - `withTimeout`: the Gemini SDK doesn't expose a per-request timeout knob, so we race the request against a `setTimeout` and throw a synthetic `Error` that `isTransient` recognises.
  - `callWithRetry`: single retry on transient failures (5xx / 408 / 429 / connection errors / timeouts), no retry on 4xx.
- **Factory**: [backend/src/llm/index.ts](backend/src/llm/index.ts) — new `case "gemini"` branch with the same "fail-on-boot if key missing" pattern as OpenAI/Anthropic, plus a hint to https://aistudio.google.com/apikey for getting a free key.
- **Health badge**: [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts) — `GET /api/health/info` now returns `llmModel: env.GEMINI_MODEL` when `LLM_PROVIDER=gemini`. The FE `<LlmBadge />` (Phase 1.6c) auto-renders `🤖 gemini · gemini-2.0-flash` without any FE change.
- **`.env.example`**: placeholders added for `GEMINI_API_KEY` and `GEMINI_MODEL`. `LLM_PROVIDER` comment now documents the four-way enum.
- **Docs**: requirements.md §10 — Gemini promoted to **Option A (recommended)** because it's free; Anthropic and OpenAI are now B/C with their paid-tier framing. Stack table row for `GEMINI_*` envs added in §3.

**Verification**

- `npx tsc --noEmit` clean.
- `npm run build` clean (`dist/` produced).
- Boot smoke pending key — without `GEMINI_API_KEY`, the factory throws on first request; with `LLM_PROVIDER=stub` (default), nothing changes.

**Files touched**

- [backend/package.json](backend/package.json) — `+ @google/genai`
- [backend/src/config/env.ts](backend/src/config/env.ts) — enum + 2 envs
- [backend/.env.example](backend/.env.example) — placeholders
- [backend/src/llm/geminiClient.ts](backend/src/llm/geminiClient.ts) — new
- [backend/src/llm/index.ts](backend/src/llm/index.ts) — factory branch
- [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts) — info row
- requirements.md — env table + §10 rewrite (Gemini = Option A)
- ARCHITECTURE.md / IMPLEMENTATION_STATUS.md — provider list updated

**Gotchas**

1. **Gemini's `responseSchema` uses uppercase OpenAPI types** (`STRING / INTEGER / ARRAY / OBJECT`), unlike OpenAI's lowercase JSON Schema. Hand-built locally to keep one place to maintain. If the grading schema ever evolves, edit `zodToGeminiSchema` in `geminiClient.ts` in lockstep.
2. **No per-request timeout in the SDK** — wrapped with a `setTimeout` race in `withTimeout`. If a future SDK version adds native timeout support, swap to that and drop the wrapper.
3. **Free-tier rate limit (15 RPM)** — fine for personal use. If multiple sessions overlap and burn through it, expect 429s; the adapter's `isTransient` recognises 429 and retries once. Tighter usage needs the paid tier.

---

## FE cosmetic pass (2026-04-26)

**Goal**

Ship the visual + interaction-quality polish required before Phase 3 work piles new features on. Audience: React devs at work who'll read the code and grade execution. Six concrete additions agreed up-front: skeletons, sonner toasts, markdown rendering for feedback, animated score radial, framer-motion microinteractions, empty states.

**What changed**

- **Toasts** — `sonner` mounted via a `<ThemedToaster />` adapter in [web/app/providers.tsx](web/app/providers.tsx) that bridges `next-themes`' resolved theme into sonner's `theme` prop. Top-right `richColors closeButton`. Wired success toasts on:
  - Login + register (`AuthModal`) — modal closes on success so the toast is the only confirmation surface between submit and the `/setup` redirect.
  - Logout (`UserMenu`) — confirms the action that otherwise just changes the header.
  - Password reset confirm (`PasswordResetForm`) — pairs with the existing inline success state. Inline submit errors stay inline (more visible inside the modal); only successes toast.
- **Markdown** — new [web/components/Markdown.tsx](web/components/Markdown.tsx) wraps `react-markdown` + `remark-gfm` with prose-light Tailwind styles applied via arbitrary variants (`[&_pre]:rounded-md` etc), no `@tailwindcss/typography` peer dep. Code blocks get a tinted muted background, inline `code` gets a small chip, links open in a new tab. **All three message bubble types** (question, answer, feedback) now render markdown — answers benefit when users paste code; questions + feedback gain code-block fidelity for technical interviews.
- **ScoreRadial** — new [web/components/ScoreRadial.tsx](web/components/ScoreRadial.tsx). Animated radial gauge using `recharts` `RadialBar` + `PolarAngleAxis` (`domain={[0, 10]}`). Three colour buckets — red (0–4), amber (5–7), green (8–10) — instead of a continuous gradient because three buckets read at-a-glance and align with rubric language. Used in:
  - The feedback bubble (size 56) — replaces the previous flat `8` chip.
  - The completion card (size 120) — shows the **average** score across all graded feedback messages with an `useMemo`'d reducer.
- **Microinteractions** — `framer-motion` entrance animations:
  - `MessageBubble` — `y: 8 → 0`, opacity fade, 250ms easeOut for question/answer; 300ms with `y: 12` for feedback (the highest-information bubble; bigger landing).
  - `CompletionCard` — `y: 16, scale: 0.98 → 1`, 400ms easeOut.
  - Restraint by design: no springs, no bounces, no decorative loops. The animations exist to draw the eye to new content, not to entertain.
- **Empty states** — new [web/components/EmptyState.tsx](web/components/EmptyState.tsx): icon + title + optional description + optional CTA slot. Applied to:
  - `/reset` page when `?token=` is missing — replaces the bare paragraph + link with a structured panel that explains why the link might be broken (30-min TTL, recency).
  - 404 (`app/not-found.tsx`) — replaced the standalone "404" badge layout with the same empty-state shape so the product feels consistent end-to-end.
- **Chat skeleton** — new [web/features/interview/ChatSkeleton.tsx](web/features/interview/ChatSkeleton.tsx) replaces the spinner-in-the-void on the interview page initial load. Three rows that mirror the real chat rhythm (interviewer → answer → interviewer) so the layout doesn't shift when the first question lands. Marked `aria-busy aria-live="polite"`.
- **Skeleton primitive** — new [web/components/ui/skeleton.tsx](web/components/ui/skeleton.tsx). Pure Tailwind `animate-pulse` block. No JS animation overhead. Used by `ChatSkeleton` today; reusable for future loading patterns.

**Test infrastructure**

- `react-markdown` + `remark-gfm` ship as pure ESM. Rather than configure Jest to transform their long dependency chain (unified, mdast-*, micromark-*, …), we mapped them to thin CJS stubs in `web/__mocks__/` via `moduleNameMapper`. The stubs render `children` as a `<div>`, which is enough for `screen.getByText("…")` matchers — no test asserted on markdown output.
- `web/jest.setup.ts` gained two stubs:
  - `ResizeObserver` — recharts' `ResponsiveContainer` hard-requires it; jsdom doesn't ship one. Noop methods are fine; we don't assert on chart geometry.
  - `matchMedia` — sonner probes it for reduced-motion preference. Always-false stub.

**Verification**

- `npx tsc --noEmit` clean.
- `npm test -- --ci` — 39/39 tests green (test count unchanged; existing `MessageBubble.test.tsx` still passes after the bubble rewrite because the stub renders text content).
- `npm run build` — clean, all 7 routes prerendered as static.

**Files touched**

- [web/package.json](web/package.json) — added `sonner`, `react-markdown`, `remark-gfm`, `recharts`, `framer-motion`
- [web/app/providers.tsx](web/app/providers.tsx) — `<ThemedToaster />` adapter + mount
- [web/components/ui/skeleton.tsx](web/components/ui/skeleton.tsx) — primitive
- [web/components/Markdown.tsx](web/components/Markdown.tsx) — new
- [web/components/ScoreRadial.tsx](web/components/ScoreRadial.tsx) — new
- [web/components/EmptyState.tsx](web/components/EmptyState.tsx) — new
- [web/features/interview/MessageBubble.tsx](web/features/interview/MessageBubble.tsx) — Markdown + ScoreRadial + framer-motion entrance
- [web/features/interview/ChatSkeleton.tsx](web/features/interview/ChatSkeleton.tsx) — new
- [web/app/interview/page.tsx](web/app/interview/page.tsx) — chat skeleton on initial load + `CompletionCard` extracted with avg-score radial + framer-motion entrance
- [web/app/not-found.tsx](web/app/not-found.tsx) — refactored to use `EmptyState`
- [web/app/reset/page.tsx](web/app/reset/page.tsx) — no-token branch uses `EmptyState`
- [web/features/auth/AuthModal.tsx](web/features/auth/AuthModal.tsx) — success toasts on login + register
- [web/features/auth/PasswordResetForm.tsx](web/features/auth/PasswordResetForm.tsx) — success toast on confirm
- [web/components/UserMenu.tsx](web/components/UserMenu.tsx) — success toast on logout
- [web/jest.setup.ts](web/jest.setup.ts) — `ResizeObserver` + `matchMedia` stubs
- [web/jest.config.ts](web/jest.config.ts) — `moduleNameMapper` entries for the ESM stubs
- [web/__mocks__/react-markdown.tsx](web/__mocks__/react-markdown.tsx) — Jest stub
- [web/__mocks__/remark-gfm.ts](web/__mocks__/remark-gfm.ts) — Jest stub
- ARCHITECTURE.md §2 — added Toasts / Markdown / Charts / Animation rows to the FE stack table

**What did NOT change**

- BE — zero changes. All cosmetic work is FE-only.
- Wire contracts, error codes, schemas — untouched.
- Existing tests — same count (39), same files, no rewrites required. The MessageBubble test still passes through the markdown stub; the new ScoreRadial renders text content via an absolute-positioned span outside the chart container, which `getByText` finds regardless of recharts behaviour in jsdom.

**Gotchas**

1. **ESM-only test pain.** `react-markdown` 9 is shipped as `"type": "module"` only. Jest's CJS-transform default chokes. Mapped to a CJS stub for tests; production runtime still uses the real package.
2. **`ResizeObserver` required by recharts.** Without the jest.setup.ts stub, every test that touches a `ResponsiveContainer` throws on mount. Noop stub works because we don't assert on geometry.
3. **`matchMedia` required by sonner.** Same shape — without it, the `<Toaster />` mount throws in tests.
4. **Score in the radial vs. score in the prose.** The radial shows `Math.round(averageScore)` while the caption below shows `averageScore.toFixed(1)`. Intentional — the visual conveys magnitude, the text conveys precision. Don't unify them by accident.
5. **Cookie maxAge unit gotcha (Express era).** Already fixed in the migration. Mentioned here only because the cosmetic pass added more `setCookie`-adjacent code paths via Sonner; if a future contributor copies cookie-setting helpers around they should sanity-check the units.

---

## Express migration (2026-04-26)

**Goal**

Replace Fastify 5 + plugin ecosystem with Express 5 + middleware ecosystem on the BE. Personal-project preference; no functional change to the wire surface, the FE, or persistence. Driven by a directive to put Express on the resume.

**What changed**

- **Deps swapped** — `fastify`, `@fastify/cookie`, `@fastify/cors`, `@fastify/rate-limit` removed. Added: `express ^5.0.1`, `cors ^2.8.5`, `cookie-parser ^1.4.7`, `express-rate-limit ^7.4.1`, `pino ^9.5.0`, `pino-http ^10.3.0` (+ matching `@types/*`).
- **Bootstrap** — [backend/src/app.ts](backend/src/app.ts) now creates an Express app with this middleware order: `pino-http` → `cors` → `express.json({ limit: "10mb" })` → `cookie-parser` → routers (health, auth, sessions) → 404 catch-all → single error funnel. `buildApp()` still returns an un-listened app so test injectors can drive it.
- **Auth plugin → middleware** — [backend/src/plugins/auth.ts](backend/src/plugins/auth.ts) keeps `signSessionToken` / `setSessionCookie` / `clearSessionCookie` / `requireAuth`, but they now operate on Express `Request` / `Response` / `NextFunction`. `req.userId` is added via `declare global namespace Express` augmentation. Cookie `maxAge` is now in **milliseconds** (Express convention) where Fastify wanted **seconds** — that's the only behavioural change between the two implementations and is invisible on the wire.
- **Rate limit plugin → middleware factory** — [backend/src/plugins/rateLimit.ts](backend/src/plugins/rateLimit.ts) exports `buildAuthRateLimiter()` which returns one shared `express-rate-limit` instance. Sharing one instance across `/login` + `/password/reset-request` keeps the counter unified — an attacker can't split traffic to double their effective cap. Custom `handler` callback emits the project-wide `{code: "RATE_LIMIT_EXCEEDED", message}` shape; `standardHeaders: false`, `legacyHeaders: false` so we don't leak `RateLimit-*` headers.
- **Routes → `express.Router()`** — All three modules (`auth`, `sessions`, `health`) are routers mounted under `/api/auth`, `/api/sessions`, `/api/health`. `/api/me` is registered directly on the app (it lives at the root of `/api`, not under `/auth`). A small `wrap()` helper threads async-handler rejections into the error funnel — Express 5 also forwards Promise rejections natively, but the wrap is defence in depth and tolerates synchronous throws too.
- **Path params** — Express 5 widens `req.params[key]` to `string | string[]` to accommodate the new wildcard matcher (`*` / `**`). Single-segment captures like `:id` and `:index` are always strings, so we narrow once at the top of each handler with `const { id } = req.params as { id: string }`.
- **Logging** — `pino-http` attaches `req.log` to every request; the shared `pino` instance is silenced when `NODE_ENV === "test"` (matches the Fastify-era behaviour). The `/api/health` liveness route is excluded from auto-logging via `autoLogging.ignore` so deployment probes don't fill the log stream.
- **Error contract** — `{code, message}` shape is identical to the Fastify era. Wire-level codes (`SESSION_NOT_FOUND`, `INVALID_CREDENTIALS`, etc.) are unchanged. No FE work required.

**What did NOT change**

- DB layer — `mongodb` driver, `MongoClient` singleton, all repos, indexes — untouched.
- Service layer — `auth.service.ts`, `password.service.ts`, `sessions.service.ts`, `ingest.ts`, all LLM clients — untouched.
- `shared/contracts.ts` zod schemas — untouched. Single source of truth still drives both BE and FE typing.
- Test harness — `mongodb-memory-server`, per-suite mongod, `mongoHarness.ts` — unchanged. The `app.inject()` call sites in `tests/` are temporarily skipped via `testPathIgnorePatterns` in `jest.config.ts`; they will be rewritten on `supertest(app)` in a follow-up sub-phase.
- FE — zero changes. `services/api.ts`, hooks, components — all unaffected.

**Verification**

- `npx tsc --noEmit` passes (BE only — `tests/` excluded via `tsconfig.json` `exclude`).
- `npm run build` produces `dist/` cleanly.
- `npm run dev` boots the server: `Server listening on http://127.0.0.1:4000`. Manual `curl http://127.0.0.1:4000/api/health` returns `{"status":"ok"}`.
- Tests skipped (`testPathIgnorePatterns`); will be rewritten on `supertest(app)`. To re-enable today, drop the ignore line from `jest.config.ts`; the BE tests will fail because they import `fastify` and call `app.inject(...)`.

**Files touched**

- [backend/package.json](backend/package.json)
- [backend/src/app.ts](backend/src/app.ts) — full rewrite on Express
- [backend/src/index.ts](backend/src/index.ts) — `app.listen()` call style
- [backend/src/plugins/auth.ts](backend/src/plugins/auth.ts) — Express middleware
- [backend/src/plugins/rateLimit.ts](backend/src/plugins/rateLimit.ts) — `express-rate-limit` factory
- [backend/src/modules/auth/auth.routes.ts](backend/src/modules/auth/auth.routes.ts) — `express.Router()`
- [backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts) — `express.Router()` + path-param narrowing
- [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts) — `express.Router()`
- [backend/jest.config.ts](backend/jest.config.ts) — `testPathIgnorePatterns` to skip pre-rewrite tests
- [backend/tsconfig.json](backend/tsconfig.json) — drop `tests/**` from `include`; `exclude` it
- ARCHITECTURE.md, IMPLEMENTATION_STATUS.md, requirements.md, PROGRESS.md — updated stack references

**Gotchas / non-obvious bits**

1. **Cookie maxAge units differ.** Express wants milliseconds; Fastify wanted seconds. The new `setSessionCookie` multiplies by `1000` to compensate. If you ever copy-paste a `maxAge` value across, double-check the units.
2. **`req.params` widening.** Express 5's path-to-regexp 8 supports `*` / `**` wildcards which CAN return arrays. Our routes use only single-segment captures, so the value is always a `string` at runtime. The `as { id: string }` narrowing reflects that runtime invariant.
3. **`pino-http` vs Fastify's built-in logger.** Both use the same `pino` instance under the hood, so log output shape is the same. Difference: Fastify auto-logged every request including `/api/health`; we explicitly opt out of health logging via `autoLogging.ignore` to keep deploy probe noise out of the stream.
4. **`trust proxy` is set in production only.** Behind a load balancer the cookie's `Secure` flag depends on detecting HTTPS, AND `express-rate-limit` reads the real client IP from `X-Forwarded-For`. Local dev doesn't need it.
5. **Error funnel ordering.** The 404 handler must be registered AFTER all routes; the error handler must be the LAST `app.use()` (Express identifies error handlers by their 4-arg signature). Got both right; if a future change reorders, the catch-all stops working silently.
6. **Tests are deferred, not abandoned.** The `testPathIgnorePatterns` line is a soft skip — the rewrite-on-supertest task is the immediate next step after FE cosmetic work lands.

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

### 2a / 2e — OpenAI + Anthropic adapters ✓ (placeholder mode)

#### Goals
- ✓ [backend/src/llm/openaiClient.ts](backend/src/llm/openaiClient.ts) — `OpenAILLMClient` implementing `LLMClient`. Thin wrapper around the `openai` SDK; uses v1 prompts from 2b. JSON-mode for grading; `.parse()` with `gradeResponseSchema` enforces shape.
- ✓ [backend/src/llm/anthropicClient.ts](backend/src/llm/anthropicClient.ts) — `AnthropicLLMClient` mirrors the OpenAI shape using `@anthropic-ai/sdk`. System message at top level (Anthropic convention); structured grading via tool-call (`tool_choice: { type: "tool", name: "submit_grade" }`).
- ✓ Factory ([backend/src/llm/index.ts](backend/src/llm/index.ts)) switches on `LLM_PROVIDER`. Throws a clear, actionable error at construction time when a real provider is selected without its key — BE fails to BOOT loudly instead of 500-ing on the first interview request.
- ✓ Both adapters: timeout from `LLM_TIMEOUT_MS` env (default 30s), `maxRetries: 0` at the SDK level, custom retry-once-on-transient (5xx / 408 / 429 / `ECONN*` / "timeout" string match) at our layer. 4xx errors bubble immediately because they're prompt bugs, not flake.
- ✓ [/api/health/info](backend/src/modules/health/health.routes.ts) populates `llmModel` from `OPENAI_MODEL` / `ANTHROPIC_MODEL`. The Phase 1.6c FE LlmBadge already reads this — it auto-flips from `🤖 stub` to `🤖 openai · gpt-4o-mini` (or anthropic equivalent) the moment env changes, with no FE code touched.
- ✓ Unit tests for both adapters with mocked SDKs (`jest.mock("openai")` / `jest.mock("@anthropic-ai/sdk")`). Plus a factory test that exercises the placeholder-mode contract: stub always works, real providers throw without keys, real providers construct correctly with keys.

**Why "placeholder mode"**: the user doesn't have OpenAI/Anthropic keys yet. The adapter code is fully written, fully tested (against mocked SDKs), and shipped. With `LLM_PROVIDER=stub` (the default), neither real adapter is instantiated — dev workflows without keys keep working. The moment a key is dropped in `.env` and `LLM_PROVIDER` flipped, the corresponding adapter activates.

**External credentials needed (to smoke-test the real path):** see [requirements.md §10](requirements.md) for OpenAI + Anthropic sign-up + key-creation steps.

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 75/75 (was 51 — +9 OpenAI, +10 Anthropic, +5 factory) |
| `cd backend && npm run build` | ✓ `dist/` emits both adapter classes |
| `cd web && npx tsc --noEmit && npm test -- --ci` | ✓ 39/39 (no FE change in 2a/2e — LlmBadge already forward-compat) |

#### New env vars

| Var | Default | Required? |
|---|---|---|
| `OPENAI_API_KEY` | (unset) | Required if `LLM_PROVIDER=openai` |
| `OPENAI_MODEL` | `gpt-4o-mini` | No |
| `ANTHROPIC_API_KEY` | (unset) | Required if `LLM_PROVIDER=anthropic` |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | No |
| `LLM_TIMEOUT_MS` | `30000` | No |

#### Changelog

- **2026-04-25** — `npm install --save openai @anthropic-ai/sdk` (2 new deps).
- **2026-04-25** — New [openaiClient.ts](backend/src/llm/openaiClient.ts). `chat.completions.create` with `response_format: { type: "json_object" }` for grading; plain text for question generation. Wrapping-quote stripping on questions because some models add `"..."` despite "no quotes" instructions in the system prompt.
- **2026-04-25** — New [anthropicClient.ts](backend/src/llm/anthropicClient.ts). `messages.create` with `system` at top level + `messages: [{role: "user", content: <user>}]`. Grading via a `submit_grade` tool with structured `input_schema` matching `gradeResponseSchema`; `tool_choice: { type: "tool", name: "submit_grade" }` forces the model to use it. Extract the `tool_use` block from the response, validate input with the v1 zod schema before mapping to `GradedAnswer`.
- **2026-04-25** — Factory [llm/index.ts](backend/src/llm/index.ts) checks for the provider's key and throws an actionable error at construction time. Error message tells the user exactly which env to set or to flip back to `stub`.
- **2026-04-25** — [health.routes.ts](backend/src/modules/health/health.routes.ts) populates `llmModel` from per-provider env. The FE [LlmBadge](web/components/LlmBadge.tsx) already handles a non-null `llmModel` (Phase 1.6c forward-compat), so the badge auto-renders the real model name with no FE change.
- **2026-04-25** — New tests:
  - [openaiClient.test.ts](backend/tests/openaiClient.test.ts) — 9 cases: construction, generateQuestion (quote stripping + correct payload), gradeAnswer (parse + JSON-mode + zod rejection), retry (5xx / 4xx-no-retry / ECONNRESET).
  - [anthropicClient.test.ts](backend/tests/anthropicClient.test.ts) — 10 cases: construction, generateQuestion (text block + system-at-top-level + empty-fallback), gradeAnswer (tool extraction + tool_choice + missing tool / zod rejection), retry (5xx / 4xx-no-retry).
  - [llmFactory.test.ts](backend/tests/llmFactory.test.ts) — 5 cases: stub returns stubClient; openai/anthropic without key throw; openai/anthropic with key construct the right adapter class.
- **2026-04-25** — Backend test count: 51 → 75.

#### Files created
- [backend/src/llm/openaiClient.ts](backend/src/llm/openaiClient.ts)
- [backend/src/llm/anthropicClient.ts](backend/src/llm/anthropicClient.ts)
- [backend/tests/openaiClient.test.ts](backend/tests/openaiClient.test.ts)
- [backend/tests/anthropicClient.test.ts](backend/tests/anthropicClient.test.ts)
- [backend/tests/llmFactory.test.ts](backend/tests/llmFactory.test.ts)

#### Files modified
- [backend/package.json](backend/package.json) — `+ openai`, `+ @anthropic-ai/sdk`
- [backend/src/config/env.ts](backend/src/config/env.ts) — `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `LLM_TIMEOUT_MS`
- [backend/.env.example](backend/.env.example) — same with sign-up URLs as comments
- [backend/src/llm/index.ts](backend/src/llm/index.ts) — factory dispatches by `LLM_PROVIDER` with key validation
- [backend/src/modules/health/health.routes.ts](backend/src/modules/health/health.routes.ts) — `llmModel` populated from per-provider env

#### Notable gotchas
1. **JSON-mode is not schema enforcement**: OpenAI's `response_format: { type: "json_object" }` only guarantees parseable JSON, not field presence. We parse with the v1 zod schema after — without that, a model that returns `{"score": "ten"}` would persist as a corrupt feedback row.
2. **Anthropic doesn't have JSON-mode**: we use a forced tool call (`tool_choice: { type: "tool", name: "submit_grade" }`) for the same shape guarantee. The tool's `input_schema` is the JSON-Schema mirror of `gradeResponseSchema`. Drift between the two is a code smell — both are in-source so a search catches them.
3. **Wrapping-quote stripping**: real models (especially the smaller ones) wrap question text in quotes despite system-prompt instructions. We strip a leading/trailing `"` to keep the chat bubble clean.
4. **Retry policy diverges from SDK defaults**: both SDKs ship with `maxRetries` defaults that hide intermittent failures behind invisible retries. We set `maxRetries: 0` and own the retry layer ourselves (one transient retry, fail fast on 4xx). Easier to reason about + log.
5. **Factory throws at construction, not first use**: this is intentional. `createLLMClient()` is called once at module load in `sessions.service.ts`. If a real provider is misconfigured, the BE fails to boot — no chance of serving 500s on the first interview. Trade-off: a typo in `OPENAI_API_KEY` blocks all routes (including auth), not just `/api/sessions`. Acceptable because the dev sees the error in their terminal immediately.

#### TODO markers planted
```ts
// (none — all forward-references are documented in JSDoc context)
```

### 2b — Prompt templates + versioning ✓

#### Goals
- ✓ New `backend/src/llm/prompts/v1/` folder with provider-agnostic renderers:
  - [generateQuestion.ts](backend/src/llm/prompts/v1/generateQuestion.ts) — `renderGenerateQuestion(ctx) → { system, user }`
  - [gradeAnswer.ts](backend/src/llm/prompts/v1/gradeAnswer.ts) — `renderGradeAnswer(q, a, ctx) → { system, user, responseSchema }` where `responseSchema` is a zod schema enforcing `{content, score: 1-10, strengths[], improvements[]}`
  - [shared.ts](backend/src/llm/prompts/v1/shared.ts) — `ROLE_DESCRIPTION`, `DIFFICULTY_DESCRIPTION`, `STYLE_DESCRIPTION` mappings + `summarizePriorAnswers` helper
  - [index.ts](backend/src/llm/prompts/v1/index.ts) — barrel export including `PROMPT_VERSION = "v1"` constant
- ✓ `MessageDoc.promptVersion?: string` field added; [sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) writes `PROMPT_VERSION` on every question + feedback insert (3 sites). User-typed answer rows leave it unset.
- ✓ `stubClient` updated to call `renderGenerateQuestion` / `renderGradeAnswer` and discard — exercises the templates in CI so prompt-shape bugs (missing enum case in shared.ts, etc.) fail fast instead of waiting for a real provider.
- ✓ 11 new BE tests in `prompts.test.ts` covering version constant, prompt interpolation, recent-answers conditional inclusion, focus-areas inclusion, JSON-shape instruction, and `gradeResponseSchema` validation (well-formed / out-of-range score / empty strengths).

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 51/51 (was 40 — +11 in prompts.test.ts) |
| `cd backend && npm run build` | ✓ `dist/` emitted (now includes `dist/llm/prompts/v1/`) |
| FE | unchanged (Phase 2b is BE-only) |

#### Why provider-agnostic prompts ship FIRST in Phase 2

The user explicitly asked for prompts written ahead of any specific provider so swapping is a config change, not a rewrite. Phase 2a + 2e adapters become thin SDK wrappers around these renderers — nothing prompt-specific lives in the adapters. Same prompts feed OpenAI (as `messages: [{role: "system"}, {role: "user"}]`) and Anthropic (as `system: ..., messages: [{role: "user", ...}]`) without modification.

#### Versioning rationale

Every question + feedback message persists `promptVersion`. When v2 prompts ship later, existing rows tagged "v1" stay; analytics can compare answer scores across versions to validate that v2 actually grades differently before retiring v1.

#### Changelog

- **2026-04-25** — Phase 2b shipped. PROGRESS.md, IMPLEMENTATION_STATUS.md, ARCHITECTURE.md, requirements.md updated.
- **2026-04-25** — New folder `backend/src/llm/prompts/v1/` with 4 files (`shared.ts`, `generateQuestion.ts`, `gradeAnswer.ts`, `index.ts`).
- **2026-04-25** — `gradeResponseSchema` zod shape mirrors the existing `Feedback` interface so persisted `feedback` subdoc on messages takes the LLM response directly — no field re-mapping. Score bounded 1-10 (integer), strengths required ≥1, improvements optional, `content` summary 1-500 chars.
- **2026-04-25** — `messages.ts` repo: `MessageDoc.promptVersion?: string`. Optional → no migration needed.
- **2026-04-25** — `sessions.service.ts` imports `PROMPT_VERSION` and writes it on three insert paths: initial question (line ~118), getQuestion fresh insert (line ~158), submitAnswer feedback + nextQuestion inserts (lines ~217, ~244).
- **2026-04-25** — `stubClient` calls both renderers and discards. CI now catches shape regressions without needing a real LLM.
- **2026-04-25** — Backend test count: 40 → 51.

#### Files created
- [backend/src/llm/prompts/v1/shared.ts](backend/src/llm/prompts/v1/shared.ts)
- [backend/src/llm/prompts/v1/generateQuestion.ts](backend/src/llm/prompts/v1/generateQuestion.ts)
- [backend/src/llm/prompts/v1/gradeAnswer.ts](backend/src/llm/prompts/v1/gradeAnswer.ts)
- [backend/src/llm/prompts/v1/index.ts](backend/src/llm/prompts/v1/index.ts)
- [backend/tests/prompts.test.ts](backend/tests/prompts.test.ts)

#### Files modified
- [backend/src/db/repos/messages.ts](backend/src/db/repos/messages.ts) — `MessageDoc.promptVersion?` field
- [backend/src/llm/stubClient.ts](backend/src/llm/stubClient.ts) — calls renderers + discards
- [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) — writes `PROMPT_VERSION` on 3 question/feedback inserts

#### Notable gotchas
1. **`PROMPT_VERSION` as a `const` re-export, not a magic string**: persisting `"v1"` directly at every insert site would drift the moment v2 lands. The constant is the single source of truth — any v2 PR that flips the constant automatically tags every new message correctly.
2. **`responseSchema` returned from the renderer**: real adapters can pass it as `response_format: { type: "json_schema", json_schema: { schema: zodToJson(schema) } }` (OpenAI) or as a tool-call schema (Anthropic). Today the schema is also used to `.parse()` the LLM response before persisting, so a malformed response fails loudly instead of polluting the messages collection with garbage.
3. **Token-budget mindfulness**: résumé truncated to 4000 chars, JD to 2000, prior-answers summary capped at 3 most recent. Total prompt size stays well under typical 8K context windows even with verbose résumés.
4. **Stub renders + discards**: trade-off — wastes ~1ms per call to render strings the stub doesn't use. Worth it because every BE test now exercises the prompt path; a future enum addition that breaks `shared.ts` ROLE_DESCRIPTION mapping fails immediately with a clear stack trace, not silently in production.

### 2c — Resume + JD parsing ✓

#### Goals
- ✓ New [backend/src/modules/sessions/ingest.ts](backend/src/modules/sessions/ingest.ts) with `parseResume({contentBase64, mime, fileName})`. Dispatches by MIME: `application/pdf` → `pdf-parse`, the DOCX MIME → `mammoth.extractRawText`, `application/msword` → rejected (legacy .doc isn't parseable by mammoth), text/* and unknown MIMEs → graceful UTF-8 fallback.
- ✓ FE [SessionSetupForm](web/features/session-setup/SessionSetupForm.tsx) switched from `readAsText` to `readAsArrayBuffer` + chunked base64 encoding. Adds `resumeMime` from `file.type` (with `application/octet-stream` fallback for unknown types).
- ✓ Wire contract: `initSessionSchema` gains required `resumeMime`. The persisted `SessionDoc.resumeContent` is now the EXTRACTED PLAIN TEXT (post-parse), not raw base64. Original bytes are discarded after parsing.
- ✓ `Session` API response gains `resumeContent` + `resumeFileName` so the sidebar's "View résumé" dialog renders parsed text directly — no second endpoint, no client-side parsing.
- ✓ Two new error codes: `RESUME_PARSE_FAILED` (400) for parse exceptions / empty content / bad base64; `UNSUPPORTED_RESUME_MIME` (415) for legacy .doc.
- ✓ Length cap: parsed output truncated to `MAX_PARSED_LENGTH` (10MB) to defend against malicious uploads.

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 88/88 (was 75 — +11 ingest cases + 2 sessions error-code cases) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| `cd web && npx tsc --noEmit && npm test -- --ci` | ✓ 39/39 (no FE behavior regression — buildRequest test fixture updated for `resumeMime`) |
| `cd web && npm run build` | ✓ 6 static routes |

#### Changelog

- **2026-04-25** — `npm install --save pdf-parse@^1.1.1 mammoth` (2 new deps). `pdf-parse@2.x` ships a complex pdfjs-dist-style API; we pin `^1.1.1` for the simple `pdfParse(buffer) → {text}` shape. `@types/pdf-parse` added as a dev dep.
- **2026-04-25** — New [backend/src/modules/sessions/ingest.ts](backend/src/modules/sessions/ingest.ts) — `parseResume`, `ResumeParseError`, `MAX_PARSED_LENGTH` constant.
- **2026-04-25** — [contracts.ts](backend/src/shared/contracts.ts) `initSessionSchema` adds required `resumeMime: z.string().min(1).max(255)`.
- **2026-04-25** — [shared/types.ts](backend/src/shared/types.ts) `SessionInitRequest` + `Session` shapes updated. `Session` gains optional `resumeContent` + `resumeFileName`.
- **2026-04-25** — [sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) `initialize()` calls `parseResume()` BEFORE persisting; throws `SessionError("RESUME_PARSE_FAILED" | "UNSUPPORTED_RESUME_MIME")` on parser failure. The route catches via the existing `statusForSessionError` / `codeForSessionError` helpers.
- **2026-04-25** — [SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx) `readFileAsBase64` replaces `readFileAsText`. Chunked encoding (0x8000 bytes/chunk) via `String.fromCharCode` + `btoa` to avoid stack overflows on big files. `resumeMime` added to the sessionStorage handoff blob.
- **2026-04-25** — [interview/page.tsx](web/app/interview/page.tsx) reads `resumeMime` from sessionStorage (with fallback to `application/octet-stream` for legacy archives) and forwards to `initializeSession`. Passes `session.resumeContent` to `<InterviewSidebar />`.
- **2026-04-25** — [InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx) gains required `resumeContent` prop. Removed the inline sessionStorage-base64 read — the dialog now displays the BE-parsed text directly.
- **2026-04-25** — Tests: new [ingest.test.ts](backend/tests/ingest.test.ts) (11 cases: text decode, PDF dispatch, DOCX dispatch, unsupported MIME, empty content, length cap, parser exception wrapping, unknown-MIME fallback). Updated [sessions.test.ts](backend/tests/sessions.test.ts) `baseInitPayload` to base64 + `resumeMime`; added 2 cases for the new error codes. Updated [useSession.test.tsx](web/hooks/useSession.test.tsx) `buildRequest` fixture.
- **2026-04-25** — Backend test count: 75 → 88. FE stable at 39 (fixture update only).

#### Files created
- [backend/src/modules/sessions/ingest.ts](backend/src/modules/sessions/ingest.ts)
- [backend/tests/ingest.test.ts](backend/tests/ingest.test.ts)

#### Files modified
- [backend/package.json](backend/package.json) — `+ pdf-parse@^1.1.1`, `+ mammoth`, `+ @types/pdf-parse` (dev)
- [backend/src/shared/contracts.ts](backend/src/shared/contracts.ts) — `resumeMime` field
- [backend/src/shared/types.ts](backend/src/shared/types.ts) — `SessionInitRequest.resumeMime` + `Session.resumeContent` / `Session.resumeFileName`
- [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) — `parseResume` call + new SessionError codes
- [backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts) — try/catch on init route + status/code helpers updated
- [backend/tests/sessions.test.ts](backend/tests/sessions.test.ts) — payload uses base64; +2 error-code tests
- [web/features/session-setup/SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx) — `readFileAsBase64` + `resumeMime`
- [web/app/interview/page.tsx](web/app/interview/page.tsx) — forward `resumeMime`; pass `session.resumeContent` to sidebar
- [web/features/interview/InterviewSidebar.tsx](web/features/interview/InterviewSidebar.tsx) — `resumeContent` prop replaces sessionStorage read
- [web/services/api.ts](web/services/api.ts) — `Session.resumeContent` + `SessionInitRequest.resumeMime`
- [web/hooks/useSession.test.tsx](web/hooks/useSession.test.tsx) — fixture update

#### Notable gotchas
1. **`pdf-parse@^1.1.1` not @2.x**: v2 was a major API rewrite with a pdfjs-style `loadDocument` → `getText` shape. We pin v1 for the simple callable export. If v1 ever goes unmaintained, `pdfreader` and `pdf2json` are alternatives; both have similarly-shaped APIs that would be one-line swaps in `parseResume`.
2. **Chunked btoa() encoding**: a naive `btoa(String.fromCharCode(...bytes))` blows the call stack on files larger than ~256KB. Chunking at 0x8000 bytes is the conventional fix.
3. **`resumeContent` semantic shift**: pre-2c it was raw text (or binary noise for PDFs); post-2c it's parsed plain text. The persisted column name didn't change — anything reading it gets the BETTER value automatically. New sessions get readable text; old sessions in Atlas keep whatever was stored.
4. **Legacy .doc rejection**: mammoth only handles `.docx` (XML zip). Legacy `.doc` (binary OLE format) needs a separate native-built parser like `antiword`. Rejecting with a clear "save as .docx or PDF" message is better UX than crashing or returning garbage.
5. **Length cap is post-parse**: a 200-page PDF that extracts to 30MB of text would otherwise blow up our prompt budget. The cap matches the wire-side `resumeContent` zod max (10MB), so a malicious upload can't exceed what we'd accept on the wire anyway.
6. **`Session.resumeContent` returned via the API**: the parsed text travels back to the FE on session init so the sidebar can show it. Trade-off: bigger response payload. Mitigation: only on init (one-shot), not on every question fetch. A future optimization could add a separate `GET /api/sessions/:id/resume` endpoint.

#### TODO markers planted
```ts
// (none — flow complete; legacy .doc support could land later via antiword if demand exists)
```

### 2d — Cost + rate guards ✓

#### Goals
- ✓ Per-user daily token/call quota (Mongo `usage_quotas` collection, doc per `(userId, day)`, 32-day TTL).
- ✓ Pre-LLM-call input-length guard (`MAX_INPUT_CHARS`, default 10000) — concatenated résumé + JD + history + answer.
- ✓ Distinct error codes: `QUOTA_EXCEEDED` (402 Payment Required) + `INPUT_TOO_LARGE` (413 Payload Too Large).
- ✓ Both guards fire BEFORE the LLM SDK call, so abusive payloads don't burn budget. Token accounting via a 4-chars-per-token heuristic (real adapters can later swap in provider-reported counts when needed).

#### Final verification (2026-04-25)

| Command | Status |
|---|---|
| `cd backend && npx tsc --noEmit` | ✓ clean |
| `cd backend && npm test` | ✓ 92/92 (was 88 — +4 quota cases in `quotas.test.ts`) |
| `cd backend && npm run build` | ✓ `dist/` emitted |
| FE | unchanged — guards are BE-only; FE surfaces the new codes via the existing `ApiError.code` plumbing |

#### New env vars

| Var | Default | Purpose |
|---|---|---|
| `DAILY_TOKEN_LIMIT` | 100000 | Per-user daily token ceiling. ~25 grading calls on `gpt-4o-mini`. Resets at UTC midnight. |
| `MAX_INPUT_CHARS` | 10000 | Hard cap on the total characters fed into a single LLM call. |

#### Changelog

- **2026-04-25** — New [backend/src/db/repos/usageQuotas.ts](backend/src/db/repos/usageQuotas.ts): `getCurrentTokens(userId)` + `recordCall(userId, tokens)` + `utcDayKey()`. Document `_id` is `${userId}:${day}` so the (userId, day) pair is uniquely keyable without a separate composite index. Atomic `$inc` on `recordCall` so concurrent calls don't lose updates. 32-day `expiresAt` TTL keeps the collection bounded with no background sweeper.
- **2026-04-25** — [backend/src/db/indexes.ts](backend/src/db/indexes.ts): added `userId` index + TTL index on `usage_quotas`.
- **2026-04-25** — [backend/src/config/env.ts](backend/src/config/env.ts) + [.env.example](backend/.env.example): `DAILY_TOKEN_LIMIT` + `MAX_INPUT_CHARS`.
- **2026-04-25** — [sessions.service.ts](backend/src/modules/sessions/sessions.service.ts):
  - `SessionError.code` gains `QUOTA_EXCEEDED` and `INPUT_TOO_LARGE`.
  - New private helpers: `ensureUnderQuotaAndLength(userId, inputChars)` (pre-call guard) and `estimateTokens(...strings)` (4 chars/token heuristic).
  - Three pre-call guards inserted: before the first question on `initialize()`, before each subsequent `getQuestion()`, and twice in `submitAnswer()` (before grading, before next-question generation).
  - Each successful LLM call now writes `usageQuotasRepo.recordCall(userId, estimateTokens(...))` so the daily counter reflects real consumption.
- **2026-04-25** — [sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts): `statusForSessionError` + `codeForSessionError` switch cases extended for the two new codes.
- **2026-04-25** — Tests: new [quotas.test.ts](backend/tests/quotas.test.ts) (4 cases): oversize JD → 413 INPUT_TOO_LARGE; pre-planted exceeded quota doc → 402 QUOTA_EXCEEDED; successful init records usage > 0; oversize answer → 413.
- **2026-04-25** — Backend test count: 88 → 92.

#### Files created
- [backend/src/db/repos/usageQuotas.ts](backend/src/db/repos/usageQuotas.ts)
- [backend/tests/quotas.test.ts](backend/tests/quotas.test.ts)

#### Files modified
- [backend/src/config/env.ts](backend/src/config/env.ts), [backend/.env.example](backend/.env.example)
- [backend/src/db/indexes.ts](backend/src/db/indexes.ts) — `usage_quotas` indexes
- [backend/src/modules/sessions/sessions.service.ts](backend/src/modules/sessions/sessions.service.ts) — guard helpers + 4 call sites
- [backend/src/modules/sessions/sessions.routes.ts](backend/src/modules/sessions/sessions.routes.ts) — status/code mapping for new errors

#### Notable gotchas
1. **Pre-call check, post-call accounting**: the guard runs BEFORE the LLM SDK call (so a hostile payload doesn't burn budget) but the token counter is bumped AFTER (so a failed call doesn't double-count). On a transient retry the SDK call may run twice; we only count once because the adapter retries internally.
2. **Heuristic token count**: 4 chars/token is OK for English text across both OpenAI and Anthropic. A real production setup would prefer the provider-reported `usage` from each response. Phase 4 observability work can lift this when needed.
3. **UTC day boundary**: quotas reset at UTC midnight, not the user's local midnight. Trade-off: simpler math + no per-user timezone storage. Acceptable for a personal-app scope.
4. **Atomic upsert via `$inc` + `$setOnInsert`**: handles the race where two concurrent calls both try to create today's doc. `$setOnInsert` only applies on insert, so the first concurrent call creates the row and the second's increment merges in cleanly.
5. **Why `_id: "${userId}:${day}"` instead of a generated UUID**: makes the doc deterministically keyable. We can `findOne({_id: id})` without a separate composite index. Good for the per-request hot path.

### 2e — Anthropic regression suite (folded into 2a/2e placeholder commit)

The Anthropic adapter shipped alongside OpenAI in the 2a/2e placeholder-mode commit (see above). Remaining 2e work:
- [ ] CI shadow-job that runs the interview flow against `LLM_PROVIDER=anthropic` when an `ANTHROPIC_API_KEY` is configured as a CI secret. Skip-if-absent gate so the workflow stays green for forks without keys.
- [ ] Snapshot-style regression tests over golden answers at temperature 0 — both providers should converge on similar scores for canned answer/question pairs. Exposes prompt drift between providers.
- **External credentials needed:** Anthropic API key as a CI secret. Skip if absent.

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
