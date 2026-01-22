import pg from "pg";
const { Pool } = pg;
import type { PoolClient } from "pg";
import type { Database, DbConfig } from "./interface.ts";

/**
 * Create a PostgreSQL connection pool.
 * All configuration must be passed explicitly - this function does not read env vars.
 */
export function createDbPool(config: DbConfig): Database {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: config.max ?? 10,
    idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
    connectionTimeoutMillis: config.connectionTimeoutMillis ?? 2000,
  });

  return pool;
}

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 */
export async function withTransaction<T>(
  db: Database,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export { Pool };
export type { PoolClient };
