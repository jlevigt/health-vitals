import { z } from "zod";

const envSchema = z.object({
  // Server Config
  PORT: z.coerce.number().optional().default(3000),
  NODE_ENV: z.string().default("development"),
  WEB_URL: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string(),

  // Security
  SECRET_JWT_KEY: z.string(),

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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid API environment variables:", JSON.stringify(parsed.error.issues, null, 2));
  process.exit(1);
}

export const env = parsed.data;
