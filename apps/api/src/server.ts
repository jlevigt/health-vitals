import "dotenv/config"; // Carrega variaveis do .env
import { createApp } from "@/app.ts";
import { logger } from "@/container.ts";
import { pool } from "@/shared/db/index.ts";

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port http://localhost:${PORT}`);
});

// Graceful Shutdown (Fecha conexão com banco ao parar)
process.on("SIGTERM", async () => {
  console.log("Closing connections...");
  await pool.end();
  process.exit(0);
});
