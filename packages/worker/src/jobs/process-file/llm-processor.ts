/**
 * LLM Processor
 * 
 * Handles LLM API calls with:
 * - Rate limit checking before calls
 * - Request tracking for observability
 * - Result parsing and database persistence
 */

import { Pool } from "@health-data/shared/db";
import { ILogger } from "@health-data/shared/logger";
import { FileStatus } from "@health-data/shared/types";
import { GoogleGenAI } from "@google/genai";

// Rate limits (adjust based on your LLM provider)
const RATE_LIMITS = {
  RPM: 60,      // Requests per minute
  RPD: 1000,    // Requests per day
  TPM: 100000,  // Tokens per minute
};

interface LlmResponse {
  collection_date: string | null;
  lab_name: string | null;
  observations: Array<{
    category: string;
    canonical_name: string;
    raw_name: string;
    raw_value: string;
    raw_unit?: string;
    normalized_value?: number;
    base_unit?: string;
    reference_low?: number;
    reference_high?: number;
    loinc_code?: string;
    material?: string;
  }>;
}

export async function processWithLlm(
  pool: Pool,
  fileId: string,
  userId: string,
  extractedText: string,
  filename: string,
  logger: ILogger
): Promise<void> {
  // Check rate limits
  const canProceed = await checkRateLimits(pool, logger);
  if (!canProceed) {
    // Set file back to QUEUED for retry
    await pool.query(
      `UPDATE files SET status = $1 WHERE id = $2`,
      [FileStatus.QUEUED, fileId]
    );
    throw new Error("Rate limit exceeded, job requeued");
  }

  // Record LLM request start
  const provider = "gemini";
  const model = "gemini-2.0-flash";
  
  const llmRequestResult = await pool.query(
    `INSERT INTO llm_requests (file_id, provider, model, started_at)
     VALUES ($1, $2, $3, now())
     RETURNING id`,
    [fileId, provider, model]
  );
  const llmRequestId = llmRequestResult.rows[0].id;

  const startTime = Date.now();
  let response: LlmResponse;

  try {
    response = await callLlmApi(extractedText, filename, logger);
  } catch (llmError) {
    const latency = Date.now() - startTime;
    
    // Update LLM request with error
    await pool.query(
      `UPDATE llm_requests 
       SET finished_at = now(), latency_ms = $1, error_code = $2, error_message = $3
       WHERE id = $4`,
      [latency, "LLM_ERROR", (llmError as Error).message, llmRequestId]
    );

    await pool.query(
      `UPDATE files SET status = $1, error_code = $2 WHERE id = $3`,
      [FileStatus.FAILED_RETRYABLE, "LLM_ERROR", fileId]
    );

    throw llmError;
  }

  const latency = Date.now() - startTime;

  // Update LLM request with success
  await pool.query(
    `UPDATE llm_requests 
     SET finished_at = now(), latency_ms = $1
     WHERE id = $2`,
    [latency, llmRequestId]
  );

  // Persist results in a transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert report
    const reportResult = await client.query(
      `INSERT INTO reports (user_id, file_id, collection_date, lab_name, file_name, status)
       VALUES ($1, $2, $3, $4, $5, 'processed')
       RETURNING id`,
      [userId, fileId, response.collection_date, response.lab_name, filename]
    );
    const reportId = reportResult.rows[0].id;

    // Insert observations
    for (const obs of response.observations) {
      await client.query(
        `INSERT INTO observations (
          report_id, category, canonical_name, raw_name, raw_value, raw_unit,
          normalized_value, base_unit, reference_low, reference_high, loinc_code, material
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          reportId,
          obs.category,
          obs.canonical_name,
          obs.raw_name,
          obs.raw_value,
          obs.raw_unit ?? null,
          obs.normalized_value ?? null,
          obs.base_unit ?? "unknown",
          obs.reference_low ?? null,
          obs.reference_high ?? null,
          obs.loinc_code ?? null,
          obs.material ?? null,
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
    
    await pool.query(
      `UPDATE files SET status = $1, error_code = $2 WHERE id = $3`,
      [FileStatus.FAILED_RETRYABLE, "DB_ERROR", fileId]
    );

    throw dbError;
  } finally {
    client.release();
  }
}

async function checkRateLimits(pool: Pool, logger: ILogger): Promise<boolean> {
  // Check requests per minute
  const rpmResult = await pool.query(
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
  const rpdResult = await pool.query(
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

async function callLlmApi(
  text: string,
  filename: string,
  logger: ILogger
): Promise<LlmResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Return mock data for development
    logger.warn("No GEMINI_API_KEY, using mock response");
    return {
      collection_date: new Date().toISOString().split("T")[0],
      lab_name: "Mock Lab",
      observations: [
        {
          category: "lipid_panel",
          canonical_name: "hdl_cholesterol",
          raw_name: "HDL Colesterol",
          raw_value: "45",
          raw_unit: "mg/dL",
          normalized_value: 45,
          base_unit: "mg_dl",
          reference_low: 40,
          reference_high: 60,
        },
      ],
    };
  }

  const genai = new GoogleGenAI({ apiKey });
  
  const prompt = `You are a medical lab report parser. Extract structured health data from this lab report.

Return JSON in this exact format:
{
  "collection_date": "YYYY-MM-DD or null",
  "lab_name": "Lab name or null",
  "observations": [
    {
      "category": "lipid_panel|glucose_metabolism|renal_function|hepatic_function|complete_blood_count|thyroid_function|other",
      "canonical_name": "snake_case_standardized_name",
      "raw_name": "Original name from report",
      "raw_value": "Original value as string",
      "raw_unit": "Original unit or null",
      "normalized_value": number or null,
      "base_unit": "standardized_unit",
      "reference_low": number or null,
      "reference_high": number or null,
      "loinc_code": "LOINC code if known or null",
      "material": "blood|urine|serum|plasma|other or null"
    }
  ]
}

Lab report text from file "${filename}":
---
${text.substring(0, 8000)}
---

Extract all lab values. Be thorough. Return valid JSON only.`;

  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const responseText = response.text ?? "";
  
  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse LLM response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as LlmResponse;
}
