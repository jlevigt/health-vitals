/**
 * Process File Integration Tests
 *
 * End-to-end tests using real PDF fixture with Mock and Real LLM providers.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { FileStatus } from "@health-vitals/contracts";
import { Buckets } from "@health-vitals/platform";
import type { JobContext } from "../../src/consumers/ai-extraction/handler.ts";
import { processFileJob } from "../../src/consumers/ai-extraction/handler.ts";
import {
  cleanupTestUser,
  closeTestDb,
  createMockLlmProvider,
  createMockLogger,
  createRealLlmProvider,
  createTestFile,
  createTestUser,
  getFileStatus,
  getObservationsByReportId,
  getReportByFileId,
  getTestDb,
  getTestStorage,
  PDF_FIXTURE_PATH,
  type TestUser,
} from "./helpers.ts";

describe("Process File Integration", () => {
  let testUser: TestUser;
  let pdfBuffer: Buffer;
  let fixtureExists: boolean;

  const db = getTestDb();
  const storage = getTestStorage();
  const mockLogger = createMockLogger();

  beforeAll(async () => {
    testUser = await createTestUser(db);

    fixtureExists = existsSync(PDF_FIXTURE_PATH);
    if (fixtureExists) {
      pdfBuffer = readFileSync(PDF_FIXTURE_PATH);
    } else {
    }
  });

  afterAll(async () => {
    await cleanupTestUser(db, testUser.id);
    await closeTestDb();
  });

  describe("With Mock LLM Provider", () => {
    it("should process real PDF end-to-end with mock LLM", async () => {
      if (!fixtureExists) {
        return;
      }

      // Create file record
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.QUEUED,
        filename: "Resultado_LABORATORIO.pdf",
      });

      // Upload PDF to storage
      await storage.uploadFile(Buckets.UPLOADS, file.object_key, pdfBuffer, "application/pdf");

      const payload = {
        file_id: file.id,
        object_key: file.object_key,
        user_id: testUser.id,
        enqueued_at: new Date().toISOString(),
      };

      const context: JobContext = {
        db,
        storage,
        logger: mockLogger,
        llmProvider: createMockLlmProvider(),
      };

      // Process the file
      await processFileJob(payload, context);

      // Verify file status is SUCCEEDED
      const status = await getFileStatus(db, file.id);
      expect(status).toBe(FileStatus.SUCCEEDED);

      // Verify report was created
      const report = await getReportByFileId(db, file.id);
      expect(report).not.toBeNull();

      // Verify observations were created (from MockLLMProvider)
      const observations = await getObservationsByReportId(db, report.id);
      expect(observations.length).toBeGreaterThan(0);
    });
  });

  describe("With Real LLM Provider", () => {
    const shouldRunRealLlm = process.env.RUN_LLM_TESTS === "true" && process.env.GEMINI_API_KEY;

    it("should process real PDF with actual Gemini API", async () => {
      if (!shouldRunRealLlm) {
        return;
      }

      if (!fixtureExists) {
        return;
      }

      // Create file record
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.QUEUED,
        filename: "Resultado_LABORATORIO_Real_LLM.pdf",
      });

      // Upload PDF to storage
      await storage.uploadFile(Buckets.UPLOADS, file.object_key, pdfBuffer, "application/pdf");

      const realLogger = createMockLogger(); // Use mock logger but could swap for verbose
      const payload = {
        file_id: file.id,
        object_key: file.object_key,
        user_id: testUser.id,
        enqueued_at: new Date().toISOString(),
      };

      const context: JobContext = {
        db,
        storage,
        logger: realLogger,
        llmProvider: createRealLlmProvider(realLogger),
      };
      const startTime = Date.now();

      // Process the file with real LLM
      await processFileJob(payload, context);

      const _duration = Date.now() - startTime;

      // Verify file status is SUCCEEDED
      const status = await getFileStatus(db, file.id);
      expect(status).toBe(FileStatus.SUCCEEDED);

      // Verify report was created
      const report = await getReportByFileId(db, file.id);
      expect(report).not.toBeNull();

      // Verify observations were created
      const observations = await getObservationsByReportId(db, report.id);
      expect(observations.length).toBeGreaterThan(0);

      for (const obs of observations) {
        const defResult = await db.query(
          "SELECT canonical_name, category_id FROM observation_definitions WHERE id = $1",
          [obs.observation_id],
        );
        const _def = defResult.rows[0];
      }
    }, 120000); // 120 second timeout for real LLM call
  });
});
