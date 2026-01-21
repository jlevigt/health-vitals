/**
 * Worker Entry Point
 * 
 * Consumes file processing jobs from RabbitMQ and processes PDF files
 * using LLM to extract structured health data.
 */

import { createQueueConnection, Queues } from "@health-data/shared/queue";
import { createDbPool } from "@health-data/shared/db";
import { createStorageClient } from "@health-data/shared/storage";
import { createLogger } from "@health-data/shared/logger";
import { FileProcessJobPayload } from "@health-data/shared/types";
import { processFileJob } from "./jobs/process-file/handler.ts";

const PREFETCH_COUNT = 1; // Process one job at a time for rate limiting

async function main() {
  const logger = createLogger({ name: "worker" });
  const pool = createDbPool();
  const storage = createStorageClient();

  logger.info("Starting worker...");

  // Test database connection
  try {
    await pool.query("SELECT 1");
    logger.info("Database connection established");
  } catch (error: any) {
    logger.error("Failed to connect to database", { 
      message: error.message,
      stack: error.stack, 
      code: error.code 
    });
    process.exit(1);
  }

  // Connect to RabbitMQ
  let connection, channel;
  try {
    const result = await createQueueConnection();
    connection = result.connection;
    channel = result.channel;
    logger.info("RabbitMQ connection established");
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", { error });
    process.exit(1);
  }

  // Setup queue
  await channel.assertQueue(Queues.FILE_PROCESSING, { durable: true });
  await channel.prefetch(PREFETCH_COUNT);

  logger.info(`Worker started, consuming from '${Queues.FILE_PROCESSING}'`);

  // Consume messages
  channel.consume(Queues.FILE_PROCESSING, async (msg) => {
    if (!msg) return;

    const startTime = Date.now();
    let payload: FileProcessJobPayload;

    try {
      payload = JSON.parse(msg.content.toString()) as FileProcessJobPayload;
      logger.info("Processing job", { fileId: payload.file_id });
    } catch (parseError) {
      logger.error("Failed to parse job payload", { error: parseError });
      channel.nack(msg, false, false); // Don't requeue malformed messages
      return;
    }

    try {
      await processFileJob(payload, { pool, storage, logger });

      const duration = Date.now() - startTime;
      logger.info("Job completed successfully", {
        fileId: payload.file_id,
        durationMs: duration,
      });

      channel.ack(msg);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Job failed", {
        fileId: payload.file_id,
        error,
        durationMs: duration,
      });

      // Don't requeue - the file status in DB will be set to failed
      // Recovery job or manual intervention can retry
      channel.nack(msg, false, false);
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down worker...");
    
    try {
      await channel.close();
      await connection.close();
      await pool.end();
      logger.info("Worker shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { error });
      process.exit(1);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
