/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

export interface LoggerConfig {
  name?: string;
  level?: string;
  pretty?: boolean;
}
