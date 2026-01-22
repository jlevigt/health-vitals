import { createApp } from "@/app.ts";
import { logger, db } from "@/container.ts";

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("Closing connections...");
  await db.end();
  process.exit(0);
});
