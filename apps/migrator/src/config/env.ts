import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),

  // Storage (for init)
  STORAGE_ENDPOINT: z.string(),
  STORAGE_REGION: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid Migrator environment variables:", JSON.stringify(parsed.error.issues, null, 2));
  process.exit(1);
}

export const env = parsed.data;
