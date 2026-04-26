/**
 * Process File Job Handler
 * 
 * Main job handler implementing the worker lifecycle:
 * 1. Lock and validate file state
 * 2. Transition to PROCESSING
 * 3. Download file from storage
 * 4. Parse PDF to text
 * 5. Check rate limits
 * 6. Call LLM and record metrics
 * 7. Persist results
 * 8. Update file status
 */

import type { Database, StorageClient, Logger, LLMProvider } from "@health-vitals/infra";
import { Buckets, FileStatus } from "@health-vitals/infra";
import type { FileProcessJobPayload } from "@health-vitals/infra";
import { extractTextFromPdf } from "./pdf-extractor.ts";
import { processWithLlm } from "./llm-processor.ts";

export interface JobContext {
  db: Database;
  storage: StorageClient;
  logger: Logger;
  llmProvider: LLMProvider;
}

export async function processFileJob(
  payload: FileProcessJobPayload,
  ctx: JobContext
): Promise<void> {
  const { file_id, object_key, user_id } = payload;
  const { db, storage, logger, llmProvider } = ctx;

  const client = await db.connect();

  try {
    // Step 1: Lock and validate
    await client.query("BEGIN");

    const fileResult = await client.query(
      `SELECT id, status, original_filename
       FROM files
       WHERE id = $1
       FOR UPDATE`,
      [file_id]
    );

    if (fileResult.rows.length === 0) {
      throw new Error(`File not found: ${file_id}`);
    }

    const file = fileResult.rows[0];

    if (file.status !== FileStatus.QUEUED) {
      logger.warn("File not in QUEUED state, skipping", {
        fileId: file_id,
        currentStatus: file.status,
      });
      await client.query("ROLLBACK");
      return; // Not an error - just skip
    }

    // Step 2: Transition to PROCESSING
    await client.query(
      `UPDATE files SET status = $1 WHERE id = $2`,
      [FileStatus.PROCESSING, file_id]
    );
    await client.query("COMMIT");

    logger.info("File locked and transitioned to PROCESSING", {
      fileId: file_id,
      filename: file.original_filename,
    });

    // Step 3: Download file from storage
    let fileBuffer: Buffer;
    try {
      fileBuffer = await storage.getFile(Buckets.UPLOADS, object_key);
      logger.info("File downloaded from storage", {
        fileId: file_id,
        sizeBytes: fileBuffer.length,
      });
    } catch (storageError) {
      await setFileFailed(db, file_id, FileStatus.FAILED_RETRYABLE, "STORAGE_ERROR");
      throw storageError;
    }

    // Step 4: Parse PDF to text
    let extractedText: string;
    try {
      extractedText = await extractTextFromPdf(fileBuffer);
      
      if (!extractedText || extractedText.trim().length < 50) {
        await setFileFailed(db, file_id, FileStatus.FAILED_TERMINAL, "EMPTY_TEXT");
        throw new Error("No meaningful text extracted from PDF");
      }

      logger.info("Text extracted from PDF", {
        fileId: file_id,
        textLength: extractedText.length,
      });
    } catch (parseError) {
      if ((parseError as Error).message === "No meaningful text extracted from PDF") {
        throw parseError;
      }
      await setFileFailed(db, file_id, FileStatus.FAILED_RETRYABLE, "PDF_PARSE_ERROR");
      throw parseError;
    }

    // Step 5-7: LLM processing with rate limiting and result persistence
    try {
      await processWithLlm(db, file_id, user_id, extractedText, file.original_filename, logger, llmProvider);
    } catch (llmError) {
      // processWithLlm handles setting file status on failure
      throw llmError;
    }

    // Step 8: Update file status to SUCCEEDED
    await db.query(
      `UPDATE files SET status = $1, processed_at = now() WHERE id = $2`,
      [FileStatus.SUCCEEDED, file_id]
    );

    logger.info("File processing completed successfully", { fileId: file_id });
  } catch (error) {
    // Rollback if we're in a transaction
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

async function setFileFailed(
  db: Database,
  fileId: string,
  status: typeof FileStatus[keyof typeof FileStatus],
  errorCode: string
): Promise<void> {
  await db.query(
    `UPDATE files SET status = $1, error_code = $2, processed_at = now() WHERE id = $3`,
    [status, errorCode, fileId]
  );
}
