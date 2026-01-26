import { z } from "zod";

const envSchema = z.object({
  // Server Config
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database
  DATABASE_URL: z.string().startsWith("postgres://"),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),

  // Security
  SECRET_JWT_KEY: z.string().min(32),

  // AI Provider
  GEMINI_API_KEY: z.string().optional(),

  // Mail
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),

  // Storage
  STORAGE_ENDPOINT: z.url(),
  STORAGE_REGION: z.string().default("us-east-1"),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),

  // RabbitMQ
  RABBITMQ_HOST: z.string().default("localhost"),
  RABBITMQ_PORT: z.coerce.number().default(5672),
  RABBITMQ_USER: z.string().default("guest"),
  RABBITMQ_PASSWORD: z.string().default("guest"),
});

// Validate and export environment variables
// In Bun, process.env is populated from .env files automatically if using bun run or --env-file
// We parse process.env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
