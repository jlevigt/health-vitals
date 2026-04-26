/**
 * Process File Integration Tests
 * 
 * End-to-end tests using real PDF fixture with Mock and Real LLM providers.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { processFileJob } from "../jobs/process-file/handler.ts";
import { FileStatus, Buckets } from "@health-vitals/infra";
import { readFileSync, existsSync } from "fs";
import {
  getTestDb,
  closeTestDb,
  getTestStorage,
  createMockLogger,
  createMockLlmProvider,
  createRealLlmProvider,
  createTestUser,
  createTestFile,
  cleanupTestUser,
  getFileStatus,
  getReportByFileId,
  getObservationsByReportId,
  PDF_FIXTURE_PATH,
  type TestUser,
} from "./helpers.ts";
import type { JobContext } from "../jobs/process-file/handler.ts";

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
      console.warn("⚠️ PDF fixture not found at:", PDF_FIXTURE_PATH);
    }
  });

  afterAll(async () => {
    await cleanupTestUser(db, testUser.id);
    await closeTestDb();
  });

  describe("With Mock LLM Provider", () => {
    it("should process real PDF end-to-end with mock LLM", async () => {
      if (!fixtureExists) {
        console.log("⚠️ Skipping: PDF fixture not found");
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

      console.log("✅ Mock LLM integration test passed");
      console.log("   Report ID:", report.id);
      console.log("   Observations:", observations.length);
    });
  });

  describe("With Real LLM Provider", () => {
    const shouldRunRealLlm = process.env.RUN_LLM_TESTS === "true" && process.env.GEMINI_API_KEY;

    it("should process real PDF with actual Gemini API", async () => {
      if (!shouldRunRealLlm) {
        console.log("⚠️ Skipping real LLM test. Set RUN_LLM_TESTS=true and GEMINI_API_KEY to run.");
        return;
      }

      if (!fixtureExists) {
        console.log("⚠️ Skipping: PDF fixture not found");
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

      console.log("\n🧠 Running real LLM test (this may take 10-30 seconds)...");
      const startTime = Date.now();

      // Process the file with real LLM
      await processFileJob(payload, context);

      const duration = Date.now() - startTime;

      // Verify file status is SUCCEEDED
      const status = await getFileStatus(db, file.id);
      expect(status).toBe(FileStatus.SUCCEEDED);

      // Verify report was created
      const report = await getReportByFileId(db, file.id);
      expect(report).not.toBeNull();

      // Verify observations were created
      const observations = await getObservationsByReportId(db, report.id);
      expect(observations.length).toBeGreaterThan(0);

      // Log results for manual inspection
      console.log("\n✅ Real LLM integration test passed!");
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Lab Name: ${report.lab_name}`);
      console.log(`   Collection Date: ${report.collection_date}`);
      console.log(`   Observations extracted: ${observations.length}`);
      console.log("\n📊 Extracted observations:");
      
      for (const obs of observations) {
        const defResult = await db.query(
          "SELECT canonical_name, category_id FROM observation_definitions WHERE id = $1",
          [obs.observation_id]
        );
        const def = defResult.rows[0];
        console.log(`   - ${def?.canonical_name}: ${obs.raw_value} ${obs.raw_unit ?? ""}`);
      }
    }, 120000); // 120 second timeout for real LLM call
  });
});
