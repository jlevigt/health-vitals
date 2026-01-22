/**
 * Worker Entry Point
 * 
 * Consumes file processing jobs from RabbitMQ and processes PDF files
 * using LLM to extract structured health data.
 */

import { Queues, FileProcessJobPayload } from "@health-data/shared";
import { db, storage, logger, llmProvider, getQueue, shutdown } from "./container.ts";
import { processFileJob } from "./jobs/process-file/handler.ts";

const PREFETCH_COUNT = 1; // Process one job at a time for rate limiting

async function main() {
  logger.info("Starting worker...");

  // Test database connection
  try {
    await db.query("SELECT 1");
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
  let queue;
  try {
    queue = await getQueue();
    logger.info("RabbitMQ connection established");
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", { error });
    process.exit(1);
  }

  const channel = queue.channel;

  // Setup queue
  await channel.assertQueue(Queues.FILE_PROCESSING, { durable: true });
  await channel.prefetch(PREFETCH_COUNT);

  logger.info(`Worker started, consuming from '${Queues.FILE_PROCESSING}'`);

  // Consume messages
  await channel.consume(Queues.FILE_PROCESSING, async (msg) => {
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
      await processFileJob(payload, { db, storage, logger, llmProvider });

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
  const handleShutdown = async () => {
    try {
      await shutdown();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
