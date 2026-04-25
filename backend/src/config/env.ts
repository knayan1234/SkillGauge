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
