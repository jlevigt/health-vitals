// packages/shared main exports

// Infrastructure
export type { Logger, LoggerConfig } from "./logger/index.ts";
export { createLogger } from "./logger/index.ts";

export type { Database, DbConfig, PoolClient } from "./db/index.ts";
export { createDbPool, withTransaction, Pool } from "./db/index.ts";

export type { QueueChannel, QueueConnection, QueueConfig, ConsumeMessage } from "./queue/index.ts";
export { createQueueConnection, publishJob, Queues } from "./queue/index.ts";

export type { StorageClient, StorageConfig } from "./storage/index.ts";
export { createStorageClient, Buckets } from "./storage/index.ts";

export type { MailProvider } from "./mail/index.ts";
export { NodeMailerProvider, ResendProvider, MockMailProvider } from "./mail/index.ts";

export type { LLMProvider, LLMResult } from "./llm/index.ts";
export { GeminiProvider, MockLLMProvider } from "./llm/index.ts";

// Errors
export { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError,
  ConflictError 
} from "./errors/index.ts";

// Types
export * from "./types/index.ts";

export { env } from "./config/env.ts";
