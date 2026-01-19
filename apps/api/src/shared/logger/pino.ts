// src/shared/providers/logger/pino-logger.provider.ts
import pino, { Logger } from "pino";
import { ILogger } from "@/shared/logger/interface.ts";

// Configuração base do Pino (extraída do app.ts anterior)
export const pinoInstance: ILogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: {
      colorize: true
    }
  } : undefined
});


