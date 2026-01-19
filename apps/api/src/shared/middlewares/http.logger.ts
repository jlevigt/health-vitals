import morgan from "morgan";
import { pinoHttp } from "pino-http";
import { pinoInstance } from "@/shared/logger/pino.ts";

export const httpLogger = process.env.NODE_ENV === "production"
  ? pinoHttp({ logger: pinoInstance as any })
  : morgan("dev");
