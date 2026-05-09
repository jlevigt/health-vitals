import { z } from "zod";

/**
 * Unified Environment Schema
 *
 * This schema contains all environment variables used across the monorepo.
 * Apps fail fast if required core variables are missing.
 * App-specific variables are optional at the schema level to allow for lean deployments,
 * but individual apps should verify their specific needs at startup.
 */
const envSchema = z.object({
  // --- Core / Common ---
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().describe("PostgreSQL connection string"),

  // --- Storage ---
  STORAGE_ENDPOINT: z.string(),
  STORAGE_REGION: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),
  STORAGE_BUCKET: z.string().optional().default("health-vitals-uploads"),

  // --- Queue ---
  RABBITMQ_URL: z.string().describe("RabbitMQ connection string"),

  // --- API Specific ---
  PORT: z.coerce.number().optional().default(3000),
  WEB_URL: z.string().optional(),
  SECRET_JWT_KEY: z.string().optional(),

  // --- Mail ---
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_PROVIDER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // --- Worker / AI Specific ---
  GEMINI_API_KEY: z.string().optional(),
});

// Use a safe parse to provide clean error messages
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
