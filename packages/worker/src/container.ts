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
} from "@health-data/shared";

// === Logger ===
export const logger: Logger = createLogger({ name: "worker" });

// === Database ===
export const db: Database = createDbPool();

// === Storage ===
export const storage: StorageClient = createStorageClient();

// === Queue ===
let _queue: QueueConnection | null = null;

export async function getQueue(): Promise<QueueConnection> {
  if (!_queue) {
    _queue = await createQueueConnection();
    logger.info("Queue connection established");
  }
  return _queue;
}

// === LLM Provider ===
export const llmProvider: LLMProvider = process.env.GEMINI_API_KEY
  ? new GeminiProvider(logger)
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
