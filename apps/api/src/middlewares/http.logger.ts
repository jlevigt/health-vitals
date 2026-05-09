import morgan from "morgan";
import pino from "pino";
import { pinoHttp } from "pino-http";

// Create pino instance for HTTP logging
const pinoInstance = pino({
  name: "http",
  level: process.env.LOG_LEVEL ?? "info",
});

export const httpLogger =
  process.env.NODE_ENV === "production" ? pinoHttp({ logger: pinoInstance }) : morgan("dev");
