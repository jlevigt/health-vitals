import { env } from "@health-vitals/platform/config/env";
import { createApp } from "@/app.ts";
import { db, logger } from "@/container.ts";

const app = createApp();
const PORT = env.PORT || 3000;

const endpoint =
  env.NODE_ENV === "production" ? "https://binderlex.com" : `http://localhost:${PORT}`;

app.listen(PORT, () => {
  logger.info(`Server running at ${endpoint}`);
});

// Graceful Shutdown
process.on("SIGTERM", async () => {
  await db.end();
  process.exit(0);
});
