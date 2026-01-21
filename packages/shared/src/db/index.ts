import pg from "pg";
const { Pool } = pg;
import type { PoolConfig, PoolClient } from "pg";

export interface DbConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Create a PostgreSQL connection pool with sensible defaults
 */
export function createDbPool(config?: DbConfig): pg.Pool {
  return new Pool({
    host: config?.host ?? process.env.POSTGRES_HOST ?? "localhost",
    port: config?.port ?? parseInt(process.env.POSTGRES_PORT ?? "5432"),
    database: config?.database ?? process.env.POSTGRES_DB,
    user: config?.user ?? process.env.POSTGRES_USER,
    password: config?.password ?? process.env.POSTGRES_PASSWORD,
    max: config?.max ?? 10,
    idleTimeoutMillis: config?.idleTimeoutMillis ?? 30000,
    connectionTimeoutMillis: config?.connectionTimeoutMillis ?? 2000,
  });
}

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 */
export async function withTransaction<T>(
  pool: pg.Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
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
