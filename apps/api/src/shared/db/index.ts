import { logger } from "@/container.ts";
import pg from "pg";

// O Pool gerencia conexões. Você conecta uma vez e ele reusa.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,
});

// Teste rápido de conexão ao iniciar (opcional, mas bom pra debug)
pool.on("error", (err) => {
  logger.error(`Unexpected error on idle client: ${err}`);
  process.exit(-1);
});
