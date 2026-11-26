/**
 * LLM Processor
 *
 * Handles LLM API calls with:
 * - Dynamic model-scoped rate limit checking before calls
 * - Request tracking for observability
 * - Result parsing and database persistence
 */

import {
  FileStatus,
  type LLMProviderResponse,
  type LLMProviderType,
  type LLMResult,
  type ModelQuota,
} from "@health-vitals/contracts";
import type { Database, LLMProvider, Logger } from "@health-vitals/platform";

export async function processWithLlm(
  db: Database,
  fileId: string,
  _userId: string,
  extractedText: string,
  filename: string,
  logger: Logger,
  llmProvider: LLMProvider,
): Promise<void> {
  const { provider, model } = llmProvider;
  const quota = llmProvider.getQuota();

  // Check rate limits if provider/model enforces a quota (bypassed for mock and local Ollama)
  if (quota !== null) {
    const canProceed = await checkRateLimits(db, provider, model, quota, logger);
    if (!canProceed) {
      // Set file back to QUEUED for retry
      await db.query(`UPDATE files SET status = $1 WHERE id = $2`, [FileStatus.QUEUED, fileId]);
      throw new Error("Rate limit exceeded, job requeued");
    }
  }

  // Record LLM request start
  const llmRequestResult = await db.query(
    `INSERT INTO llm_requests (file_id, provider, model, started_at)
     VALUES ($1, $2, $3, now())
     RETURNING id`,
    [fileId, provider, model],
  );
  const llmRequestId = llmRequestResult.rows[0].id;

  const startTime = Date.now();
  let providerResponse: LLMProviderResponse;

  try {
    providerResponse = await llmProvider.processDocument(extractedText, filename);
  } catch (llmError) {
    const latency = Date.now() - startTime;

    // Update LLM request with error
    await db.query(
      `UPDATE llm_requests 
       SET finished_at = now(), latency_ms = $1, error_code = $2, error_message = $3
       WHERE id = $4`,
      [latency, "LLM_ERROR", (llmError as Error).message, llmRequestId],
    );

    await db.query(`UPDATE files SET status = $1, error_code = $2 WHERE id = $3`, [
      FileStatus.FAILED_RETRYABLE,
      "LLM_ERROR",
      fileId,
    ]);

    throw llmError;
  }

  const latency = Date.now() - startTime;
  const { data: response, usage, model: responseModel } = providerResponse;

  // Update LLM request with success and metrics
  await db.query(
    `UPDATE llm_requests 
     SET finished_at = now(), 
         latency_ms = $1, 
         prompt_tokens = $2, 
         completion_tokens = $3, 
         total_tokens = $4,
         model = COALESCE($5, model)
     WHERE id = $6`,
    [
      latency,
      usage?.prompt_tokens ?? null,
      usage?.completion_tokens ?? null,
      usage?.total_tokens ?? null,
      responseModel ?? null,
      llmRequestId,
    ],
  );

  await persistReportAndObservations(db, fileId, response, logger);
}

async function persistReportAndObservations(
  db: Database,
  fileId: string,
  response: LLMResult,
  logger: Logger,
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Insert report
    const reportResult = await client.query(
      `INSERT INTO reports (file_id, collection_date, lab_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [fileId, response.collection_date, response.lab_name],
    );
    const reportId = reportResult.rows[0].id;

    // Insert observations
    for (const obs of response.observations) {
      // Find or create observation definition
      const defResult = await client.query(
        `SELECT id FROM observation_definitions WHERE canonical_name = $1`,
        [obs.canonical_name],
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
          [obs.category, obs.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())],
        );
        const categoryId = categoryResult.rows[0].id;

        // Create observation definition
        const newDefResult = await client.query(
          `INSERT INTO observation_definitions (category_id, canonical_name, base_unit)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [categoryId, obs.canonical_name, obs.base_unit || "unknown"],
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
        ],
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

    await db.query(`UPDATE files SET status = $1, error_code = $2 WHERE id = $3`, [
      FileStatus.FAILED_RETRYABLE,
      "DB_ERROR",
      fileId,
    ]);

    throw dbError;
  } finally {
    client.release();
  }
}

async function checkRateLimits(
  db: Database,
  provider: LLMProviderType,
  model: string,
  quota: ModelQuota,
  logger: Logger,
): Promise<boolean> {
  // Check requests per minute (RPM)
  const rpmResult = await db.query(
    `SELECT COUNT(*) as count
     FROM llm_requests
     WHERE provider = $1 AND model = $2
       AND started_at > now() - interval '1 minute'`,
    [provider, model],
  );
  const rpm = parseInt(rpmResult.rows[0].count, 10);

  if (rpm >= quota.rpm) {
    logger.warn("Rate limit exceeded (RPM)", {
      provider,
      model,
      current: rpm,
      limit: quota.rpm,
    });
    return false;
  }

  // Check requests per day (RPD)
  const rpdResult = await db.query(
    `SELECT COUNT(*) as count
     FROM llm_requests
     WHERE provider = $1 AND model = $2
       AND started_at >= date_trunc('day', now())`,
    [provider, model],
  );
  const rpd = parseInt(rpdResult.rows[0].count, 10);

  if (rpd >= quota.rpd) {
    logger.warn("Rate limit exceeded (RPD)", {
      provider,
      model,
      current: rpd,
      limit: quota.rpd,
    });
    return false;
  }

  // Check tokens per minute (TPM)
  const tpmResult = await db.query(
    `SELECT COALESCE(SUM(total_tokens), 0) as tokens
     FROM llm_requests
     WHERE provider = $1 AND model = $2
       AND started_at > now() - interval '1 minute'`,
    [provider, model],
  );
  const tpm = parseInt(tpmResult.rows[0].tokens, 10);

  if (tpm >= quota.tpm) {
    logger.warn("Rate limit exceeded (TPM)", {
      provider,
      model,
      current: tpm,
      limit: quota.tpm,
    });
    return false;
  }

  return true;
}
