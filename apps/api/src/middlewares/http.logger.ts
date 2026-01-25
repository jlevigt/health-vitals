import morgan from "morgan";
import { pinoHttp } from "pino-http";
import pino from "pino";

// Create pino instance for HTTP logging
const pinoInstance = pino({
  name: "http",
  level: process.env.LOG_LEVEL ?? "info",
});

export const httpLogger = process.env.NODE_ENV === "production"
  ? pinoHttp({ logger: pinoInstance })
  : morgan("dev");
