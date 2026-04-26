import pino from "pino";
import type { Logger as PinoLogger, LoggerOptions } from "pino";
import type { Logger, LoggerConfig } from "@health-vitals/core";

/**
 * Create a Pino logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
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
 * Wrap Pino logger to match Logger interface
 */
function wrapLogger(logger: PinoLogger): Logger {
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
    child(bindings: Record<string, unknown>): Logger {
      return wrapLogger(logger.child(bindings));
    },
  };
}

export type { PinoLogger };
