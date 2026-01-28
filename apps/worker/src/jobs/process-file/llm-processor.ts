/**
 * LLM Processor
 * 
 * Handles LLM API calls with:
 * - Rate limit checking before calls
 * - Request tracking for observability
 * - Result parsing and database persistence
 */

import type { Database, Logger, LLMProvider, LLMResult } from "@health-data/shared";
import { FileStatus } from "@health-data/shared";

// Rate limits (adjust based on your LLM provider)
const RATE_LIMITS = {
  RPM: 5,      // Requests per minute
  RPD: 20,    // Requests per day
  TPM: 250000,  // Tokens per minute
};

export async function processWithLlm(
  db: Database,
  fileId: string,
  _userId: string,
  extractedText: string,
  filename: string,
  logger: Logger,
  llmProvider: LLMProvider
): Promise<void> {
  // Check rate limits
  const canProceed = await checkRateLimits(db, logger);
  if (!canProceed) {
    // Set file back to QUEUED for retry
    await db.query(
      `UPDATE files SET status = $1 WHERE id = $2`,
      [FileStatus.QUEUED, fileId]
    );
    throw new Error("Rate limit exceeded, job requeued");
  }

  // Record LLM request start
  const provider = "gemini";
  const model = "gemini-2.5-flash";
  
  const llmRequestResult = await db.query(
    `INSERT INTO llm_requests (file_id, provider, model, started_at)
     VALUES ($1, $2, $3, now())
     RETURNING id`,
    [fileId, provider, model]
  );
  const llmRequestId = llmRequestResult.rows[0].id;

  const startTime = Date.now();
  let response: LLMResult;

  try {
    response = await llmProvider.processDocument(extractedText, filename);
  } catch (llmError) {
    const latency = Date.now() - startTime;
    
    // Update LLM request with error
    await db.query(
      `UPDATE llm_requests 
       SET finished_at = now(), latency_ms = $1, error_code = $2, error_message = $3
       WHERE id = $4`,
      [latency, "LLM_ERROR", (llmError as Error).message, llmRequestId]
    );

    await db.query(
      `UPDATE files SET status = $1, error_code = $2 WHERE id = $3`,
      [FileStatus.FAILED_RETRYABLE, "LLM_ERROR", fileId]
    );

    throw llmError;
  }

  const latency = Date.now() - startTime;

  // Update LLM request with success
  await db.query(
    `UPDATE llm_requests 
     SET finished_at = now(), latency_ms = $1
     WHERE id = $2`,
    [latency, llmRequestId]
  );

  // Persist results in a transaction
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Insert report
    const reportResult = await client.query(
      `INSERT INTO reports (file_id, collection_date, lab_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [fileId, response.collection_date, response.lab_name]
    );
    const reportId = reportResult.rows[0].id;

    // Insert observations
    for (const obs of response.observations) {
      // Find or create observation definition
      const defResult = await client.query(
        `SELECT id FROM observation_definitions WHERE canonical_name = $1`,
        [obs.canonical_name]
      );

      let observationDefId: string;
      if (defResult.rows.length > 0) {
        observationDefId = defResult.rows[0].id;
      } else {
        // Find or create category
        const categoryResult = await client.query(
          `INSERT INTO observation_categories (code, display_name)
           VALUES ($1, $2)
           ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code
           RETURNING id`,
          [obs.category, obs.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]
        );
        const categoryId = categoryResult.rows[0].id;

        // Create observation definition
        const newDefResult = await client.query(
          `INSERT INTO observation_definitions (category_id, canonical_name, base_unit)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [categoryId, obs.canonical_name, obs.base_unit || 'unknown']
        );
        observationDefId = newDefResult.rows[0].id;
      }

      await client.query(
        `INSERT INTO observations (
          report_id, observation_id, raw_name, raw_value, raw_unit,
          normalized_value, reference_low, reference_high
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          reportId,
          observationDefId,
          obs.raw_name,
          obs.raw_value,
          obs.raw_unit ?? null,
          obs.normalized_value ?? null,
          obs.reference_low ?? null,
          obs.reference_high ?? null,
        ]
      );
    }

    await client.query("COMMIT");

    logger.info("Report and observations persisted", {
      fileId,
      reportId,
      observationsCount: response.observations.length,
    });
  } catch (dbError) {
    await client.query("ROLLBACK");
    
    await db.query(
      `UPDATE files SET status = $1, error_code = $2 WHERE id = $3`,
      [FileStatus.FAILED_RETRYABLE, "DB_ERROR", fileId]
    );

    throw dbError;
  } finally {
    client.release();
  }
}

async function checkRateLimits(db: Database, logger: Logger): Promise<boolean> {
  // Check requests per minute
  const rpmResult = await db.query(
    `SELECT COUNT(*) as count
     FROM llm_requests
     WHERE started_at > now() - interval '1 minute'`
  );
  const rpm = parseInt(rpmResult.rows[0].count);

  if (rpm >= RATE_LIMITS.RPM) {
    logger.warn("Rate limit exceeded (RPM)", { current: rpm, limit: RATE_LIMITS.RPM });
    return false;
  }

  // Check requests per day
  const rpdResult = await db.query(
    `SELECT COUNT(*) as count
     FROM llm_requests
     WHERE started_at >= date_trunc('day', now())`
  );
  const rpd = parseInt(rpdResult.rows[0].count);

  if (rpd >= RATE_LIMITS.RPD) {
    logger.warn("Rate limit exceeded (RPD)", { current: rpd, limit: RATE_LIMITS.RPD });
    return false;
  }

  return true;
}
