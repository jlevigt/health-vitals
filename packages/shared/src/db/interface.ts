import type { PoolClient } from "pg";

/**
 * Database configuration interface
 */
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
 * Database pool interface for dependency injection
 */
export interface Database {
  query<T = any>(text: string, values?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  connect(): Promise<PoolClient>;
  end(): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): void;
}

export type { PoolClient };
