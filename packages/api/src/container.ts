/**
 * API Dependency Container
 * 
 * Central location for all infrastructure dependencies.
 * All feature routes should import infrastructure from here.
 */

import { 
  Logger, 
  createLogger,
  createDbPool,
  createQueueConnection,
  createStorageClient,
  StorageClient,
  MailProvider,
  NodeMailerProvider,
  MockMailProvider,
  Database,
  QueueConnection,
} from "@health-data/shared";

// === Logger ===
export const logger: Logger = createLogger({ name: "api" });

// === Database ===
const dbLogger = createLogger({ name: "db" });

export const db: Database = createDbPool({
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: parseInt(process.env.POSTGRES_PORT ?? "5432"),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.on("error", (err) => {
  dbLogger.error(`Unexpected error on idle client: ${err}`);
  process.exit(-1);
});

// === Storage ===
export const storage: StorageClient = createStorageClient();

// === Queue (API is publisher) ===
let _queue: QueueConnection | null = null;

export async function getQueue(): Promise<QueueConnection> {
  if (!_queue) {
    _queue = await createQueueConnection();
    logger.info("Queue connection established");
  }
  return _queue;
}

// === Mail Provider ===
export const mailProvider: MailProvider = process.env.NODE_ENV === "test"
  ? new MockMailProvider()
  : new NodeMailerProvider(logger);

// Note: API does NOT use LLM directly — worker handles LLM calls
