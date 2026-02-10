import { z } from "zod";

const envSchema = z.object({
  // Server Config
  PORT: z.coerce.number().optional(),
  NODE_ENV: z.string(),
  WEB_URL: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string(),

  // Security
  SECRET_JWT_KEY: z.string(),

  // AI Provider
  GEMINI_API_KEY: z.string().optional(),

  // Mail
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_PROVIDER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Storage
  STORAGE_ENDPOINT: z.string(),
  STORAGE_REGION: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),
  STORAGE_BUCKET: z.string().optional(),

  // RabbitMQ
  RABBITMQ_URL: z.string(),
});

// Validate and export environment variables
// In Bun, process.env is populated from .env files automatically if using bun run or --env-file
// We parse process.env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.issues, null, 2));
  process.exit(1);
}

export const env = parsed.data;
