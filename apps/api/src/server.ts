import { createApp } from "@/app.ts";
import { logger, db } from "@/container.ts";
import { env } from "@health-vitals/platform/config/env";

const app = createApp();
const PORT = env.PORT || 3000;

const endpoint = env.NODE_ENV === "production" ? "https://binderlex.com" : "http://localhost:" + PORT;

app.listen(PORT, () => {
  logger.info(`Server running at ${endpoint}`);
});

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("Closing connections...");
  await db.end();
  process.exit(0);
});
