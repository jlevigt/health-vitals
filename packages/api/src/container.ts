// src/container.ts
import { ILogger } from "./shared/logger/interface.ts";
import { pinoInstance } from "./shared/logger/pino.ts";
import { ILLMProvider } from "./shared/llm/interface.ts"; // NOVO
import { GeminiProvider } from "./shared/llm/gemini.ts"; // NOVO
import { MockLLMProvider } from "./shared/llm/mock.ts"; // NOVO
import { IMailProvider } from "./shared/mail/interface.ts";
import { NodeMailerProvider } from "./shared/mail/nodemailer.ts";

// === Instâncias Singleton ===

// Logger
export const logger: ILogger = pinoInstance;

// Email Provider
export const mailProvider: IMailProvider = new NodeMailerProvider(logger);

// LLM Provider (Chave de Decisão de Ambiente)
// Se GEMINI_API_KEY não estiver definida, usa o Mock.
export const llmProvider: ILLMProvider = process.env.GEMINI_API_KEY ? new GeminiProvider(logger) : new MockLLMProvider();
