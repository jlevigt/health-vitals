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
  env,
} from "@health-data/shared";

// === Logger ===
export const logger: Logger = createLogger({ name: "api" });

// === Database ===
const dbLogger = createLogger({ name: "db" });

export const db: Database = createDbPool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.on("error", (err) => {
  dbLogger.error(`Unexpected error on idle client: ${err}`);
  process.exit(-1);
});

// === Storage ===
export const storage: StorageClient = createStorageClient({
  endpoint: env.STORAGE_ENDPOINT,
  region: env.STORAGE_REGION,
  accessKeyId: env.STORAGE_ACCESS_KEY,
  secretAccessKey: env.STORAGE_SECRET_KEY,
  forcePathStyle: true,
});

// === Queue (API is publisher) ===
let _queue: QueueConnection | null = null;

export async function getQueue(): Promise<QueueConnection> {
  if (!_queue) {
    logger.info("Connecting to RabbitMQ...");
    try {
      _queue = await createQueueConnection(env.RABBITMQ_URL);
      logger.info("RabbitMQ connection established");
    } catch (error) {
       logger.error("Failed to connect to RabbitMQ", { error });
       // API cannot function without queue for async tasks, fail fast or let it throw
       throw error;
    }
  }
  return _queue;
}

// === Mail Provider ===
import { ResendProvider } from "@health-data/shared";

// === Mail Provider ===
const mailProviderType = env.MAIL_PROVIDER || "nodemailer";
const resendApiKey = env.RESEND_API_KEY;

let mailer: MailProvider;

if (process.env.NODE_ENV === "test") {
  mailer = new MockMailProvider();
} else if (mailProviderType === "resend" && resendApiKey) {
  mailer = new ResendProvider(logger, resendApiKey);
} else {
  // Fallback to nodemailer (or mock if no config, but NodeMailerProvider handles its own config)
  mailer = new NodeMailerProvider(logger);
}

export const mailProvider = mailer;

// Note: API does NOT use LLM directly — worker handles LLM calls
