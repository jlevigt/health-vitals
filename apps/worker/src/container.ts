/**
 * Worker Dependency Container
 * 
 * Central location for all infrastructure dependencies.
 * All job handlers should receive dependencies from here.
 */

import { 
  Logger, 
  createLogger,
  createDbPool,
  createStorageClient,
  createQueueConnection,
  Database,
  StorageClient,
  QueueConnection,
  LLMProvider,
  GeminiProvider,
  MockLLMProvider,
} from "@health-vitals/infra";
import { env } from "@/config/env";

// === Logger ===
export const logger: Logger = createLogger({ name: "worker" });

// === Database ===
export const db: Database = createDbPool({
  connectionString: env.DATABASE_URL,
});

// === Storage ===
export const storage: StorageClient = createStorageClient({
  endpoint: env.STORAGE_ENDPOINT,
  region: env.STORAGE_REGION,
  accessKeyId: env.STORAGE_ACCESS_KEY,
  secretAccessKey: env.STORAGE_SECRET_KEY,
  forcePathStyle: true,
});

// === Queue ===
let _queue: QueueConnection | null = null;

export async function getQueue(): Promise<QueueConnection> {
  if (_queue) return _queue;

  const maxRetries = 10;
  const retryDelay = 5000;

  for (let i = 1; i <= maxRetries; i++) {
    try {
      logger.info(`Connecting to RabbitMQ (attempt ${i}/${maxRetries})...`);
      _queue = await createQueueConnection(env.RABBITMQ_URL);
      logger.info("RabbitMQ connection established");
      return _queue;
    } catch (error) {
      if (i === maxRetries) {
        logger.error("Failed to connect to RabbitMQ after maximum retries", { error });
        process.exit(1);
      }
      logger.warn(`Failed to connect to RabbitMQ, retrying in ${retryDelay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error("Failed to connect to RabbitMQ");
}

// === LLM Provider ===
export const llmProvider: LLMProvider = env.GEMINI_API_KEY
  ? new GeminiProvider(logger, env.GEMINI_API_KEY)
  : new MockLLMProvider();

// === Cleanup ===
export async function shutdown(): Promise<void> {
  logger.info("Shutting down worker...");
  
  try {
    if (_queue) {
      await _queue.close();
    }
    await db.end();
    logger.info("Worker shutdown complete");
  } catch (error) {
    logger.error("Error during shutdown", { error });
    throw error;
  }
}
