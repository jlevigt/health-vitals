import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  
  // Database
  DATABASE_URL: z.string(),

  // AI Provider
  GEMINI_API_KEY: z.string(),

  // Storage
  STORAGE_ENDPOINT: z.string(),
  STORAGE_REGION: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),

  // RabbitMQ
  RABBITMQ_URL: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid Worker environment variables:", JSON.stringify(parsed.error.issues, null, 2));
  process.exit(1);
}

export const env = parsed.data;
