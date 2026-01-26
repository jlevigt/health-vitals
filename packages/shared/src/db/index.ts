// Re-exports for clean imports
export type { Database, DbConfig, PoolClient } from "./interface.ts";
export { createDbPool, withTransaction, Pool } from "./pg.ts";
