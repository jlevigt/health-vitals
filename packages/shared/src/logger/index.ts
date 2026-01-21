import pino from "pino";
import type { Logger, LoggerOptions } from "pino";

export interface LoggerConfig {
  name?: string;
  level?: string;
  pretty?: boolean;
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  info(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): ILogger;
}

/**
 * Create a Pino logger instance
 */
export function createLogger(config?: LoggerConfig): ILogger {
  const isDev = process.env.NODE_ENV !== "production";
  const usePretty = config?.pretty ?? isDev;

  const options: LoggerOptions = {
    name: config?.name ?? "app",
    level: config?.level ?? process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    ...(usePretty && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    }),
  };

  const logger = pino(options);

  return wrapLogger(logger);
}

/**
 * Wrap Pino logger to match ILogger interface
 */
function wrapLogger(logger: Logger): ILogger {
  return {
    info(msg: string, data?: Record<string, unknown>) {
      if (data) {
        logger.info(data, msg);
      } else {
        logger.info(msg);
      }
    },
    error(msg: string, data?: Record<string, unknown>) {
      if (data) {
        logger.error(data, msg);
      } else {
        logger.error(msg);
      }
    },
    warn(msg: string, data?: Record<string, unknown>) {
      if (data) {
        logger.warn(data, msg);
      } else {
        logger.warn(msg);
      }
    },
    debug(msg: string, data?: Record<string, unknown>) {
      if (data) {
        logger.debug(data, msg);
      } else {
        logger.debug(msg);
      }
    },
    child(bindings: Record<string, unknown>): ILogger {
      return wrapLogger(logger.child(bindings));
    },
  };
}

export type { Logger };
