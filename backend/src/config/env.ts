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
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
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
  LLM_PROVIDER: z.enum(["stub", "openai", "anthropic"]).default("stub"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

// Dev default keeps `npm run dev` working without a .env file. Production MUST set JWT_SECRET.
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  process.env.JWT_SECRET =
    "dev_only_jwt_secret_replace_in_production_do_not_ship_this_value";
}

export const env = schema.parse(process.env);
export type Env = typeof env;
