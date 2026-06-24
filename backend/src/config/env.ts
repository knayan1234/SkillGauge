import "dotenv/config";
import { z } from "zod";

// Parse + validate all env vars at boot. A missing JWT_SECRET in production must crash early,
// not silently issue tokens signed with undefined. Zod gives us one place to enforce that.
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("127.0.0.1"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  // Session lifetime in days. 7 matches the prior hardcoded default.
  JWT_TTL_DAYS: z.coerce.number().int().positive().default(7),
  // Password reset token lifetime in minutes. 30 is the industry default — long enough
  // for the user to switch from email tab to the app, short enough to limit replay risk.
  RESET_TTL_MIN: z.coerce.number().int().positive().default(30),
  // Auth rate limit + lockout.
  // - LOGIN_LOCKOUT_THRESHOLD: failed attempts in the window before soft lockout kicks in.
  // - LOGIN_LOCKOUT_WINDOW_MIN: window length (minutes) for the failure count + the
  //   lockout duration itself (they share a value — TTL on each failure record matches
  //   the window, so failures expire as the window rolls).
  // - AUTH_RATE_PER_MIN: per-IP requests-per-minute cap on /api/auth/* hot routes.
  LOGIN_LOCKOUT_THRESHOLD: z.coerce.number().int().positive().default(5),
  LOGIN_LOCKOUT_WINDOW_MIN: z.coerce.number().int().positive().default(15),
  AUTH_RATE_PER_MIN: z.coerce.number().int().positive().default(10),
  // Mongo connection string. Tests override at runtime with mongodb-memory-server.
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017"),
  MONGODB_DB: z.string().default("skillgauge"),
  LLM_PROVIDER: z
    .enum(["stub", "openai", "anthropic", "gemini"])
    .default("stub"),
  // Real-provider configuration. All optional at the schema level — the factory in
  // `src/llm/index.ts` enforces "key required when provider selects this adapter" with
  // a clear startup error so a missing key fails fast instead of silently falling back.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  // Gemini — Google's free-tier-friendly option. 1M-token context window on 2.0 Flash;
  // 15 RPM / 1500 RPD on the free tier as of 2026. The default model name is the
  // current free Flash variant; bump as Google rotates the GA tag.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  // Embeddings layer. Independent from LLM_PROVIDER because chat and embeddings are
  // different endpoints with different cost / rate-limit profiles.
  // Today: "stub" (deterministic hash-derived vectors — no key, no real semantic
  // meaning, but the storage path runs end-to-end) or "gemini" (reuses GEMINI_API_KEY).
  EMBEDDINGS_PROVIDER: z.enum(["stub", "gemini"]).default("stub"),
  GEMINI_EMBED_MODEL: z.string().default("gemini-embedding-001"),
  // Vector dimensionality. Must match the Atlas Search index spec — if a future
  // provider returns a different dim, you must rebuild the index. 768 is the default
  // for `gemini-embedding-001` and the stub.
  EMBEDDINGS_DIMENSIONS: z.coerce.number().int().positive().default(768),
  // Per-call timeout for real LLM requests (ms). Default 30s — generous enough for hard
  // questions on slower models, tight enough that a stuck provider doesn't pin a request.
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  // Cost + rate guards.
  // - DAILY_TOKEN_LIMIT: per-user daily ceiling on LLM tokens consumed across all of
  //   their sessions. Resets at the day boundary (UTC). Default 100k tokens covers
  //   ~25 grading calls on gpt-4o-mini at typical question/answer lengths.
  // - MAX_INPUT_CHARS: hard cap on the total characters fed into a single LLM call.
  //   Defends against abusive payloads that would burn budget without producing signal.
  //   Sized for a realistic prompt: ~10K resume + ~5K JD + ~30K rolling question
  //   history (round 4+) + ~5K rendered prompt scaffolding ≈ 50K. Gemini's 1M-token
  //   context handles this trivially; OpenAI/Anthropic are fine too.
  DAILY_TOKEN_LIMIT: z.coerce.number().int().positive().default(100_000),
  MAX_INPUT_CHARS: z.coerce.number().int().positive().default(60_000),
  // Transactional email for password-reset links. MAIL_PROVIDER picks the impl:
  // "log" (default — logs the link, no send) or "smtp" (Nodemailer → any SMTP, e.g. Brevo).
  // The mailer factory falls back to "log" if smtp is selected without SMTP_* creds, so a
  // misconfiguration never breaks the reset flow — it just doesn't send.
  MAIL_PROVIDER: z.enum(["log", "smtp", "brevo"]).default("log"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Brevo HTTP API key (xkeysib-...) — used when MAIL_PROVIDER=brevo. Sends over HTTPS
  // (443) instead of SMTP ports, which PaaS hosts often block. Distinct from the SMTP key.
  BREVO_API_KEY: z.string().optional(),
  // From-address on outgoing mail — must be a verified sender on your SMTP provider
  // (e.g. Brevo → Senders), or the provider rejects the send.
  MAIL_FROM: z.string().default("SkillGauge <no-reply@skillgauge.app>"),
  // Public base URL of the frontend, for absolute links in emails (${APP_URL}/reset?token=...).
  APP_URL: z.string().default("http://localhost:3000"),
});

// Dev default keeps `npm run dev` working without a .env file. Production MUST set JWT_SECRET.
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  process.env.JWT_SECRET =
    "dev_only_jwt_secret_replace_in_production_do_not_ship_this_value";
}

export const env = schema.parse(process.env);
export type Env = typeof env;
