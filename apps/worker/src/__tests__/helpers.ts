/**
 * Test Helpers for Worker Tests
 * 
 * Shared utilities for setting up test data, mocking dependencies,
 * and cleaning up after tests.
 */

import { 
  createDbPool, 
  createStorageClient,
  createLogger,
  FileStatus,
  MockLLMProvider,
  GeminiProvider,
  type Database,
  type StorageClient,
  type Logger,
  type LLMProvider,
} from "@health-data/shared";
import type { JobContext } from "../jobs/process-file/handler.ts";
import { randomUUID } from "crypto";

// === Database ===
let _testDb: Database | null = null;

export function getTestDb(): Database {
  if (!_testDb) {
    _testDb = createDbPool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });
  }
  return _testDb;
}

export async function closeTestDb(): Promise<void> {
  if (_testDb) {
    await _testDb.end();
    _testDb = null;
  }
}

// === Storage ===
let _testStorage: StorageClient | null = null;

export function getTestStorage(): StorageClient {
  if (!_testStorage) {
    _testStorage = createStorageClient();
  }
  return _testStorage;
}

// === Logger ===
export function createMockLogger(): Logger {
  return createLogger({ name: "test", level: "silent" });
}

// === LLM Providers ===
export function createMockLlmProvider(): LLMProvider {
  return new MockLLMProvider();
}

export function createRealLlmProvider(logger: Logger): LLMProvider {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set for real LLM test");
  }
  return new GeminiProvider(logger);
}

// === Job Context Factory ===
export function createTestJobContext(options?: {
  useMockLlm?: boolean;
}): JobContext {
  const logger = createMockLogger();
  return {
    db: getTestDb(),
    storage: getTestStorage(),
    logger,
    llmProvider: options?.useMockLlm !== false 
      ? createMockLlmProvider() 
      : createRealLlmProvider(logger),
  };
}

// === Test Data Factories ===
export interface TestUser {
  id: string;
  email: string;
}

export async function createTestUser(db: Database): Promise<TestUser> {
  const email = `test_${Date.now()}_${randomUUID().slice(0, 8)}@example.com`;
  const result = await db.query(
    `INSERT INTO users (email, password_hash, is_active) 
     VALUES ($1, 'test_hash', true) 
     RETURNING id`,
    [email]
  );
  return { id: result.rows[0].id, email };
}

export interface TestFile {
  id: string;
  object_key: string;
  original_filename: string;
}

export async function createTestFile(
  db: Database, 
  userId: string,
  options?: {
    status?: typeof FileStatus[keyof typeof FileStatus];
    filename?: string;
  }
): Promise<TestFile> {
  const filename = options?.filename ?? "test_report.pdf";
  const objectKey = `uploads/${userId}/${Date.now()}_${filename}`;
  const status = options?.status ?? FileStatus.QUEUED;

  const result = await db.query(
    `INSERT INTO files (user_id, original_filename, object_key, size_bytes, status)
     VALUES ($1, $2, $3, 1024, $4)
     RETURNING id`,
    [userId, filename, objectKey, status]
  );

  return {
    id: result.rows[0].id,
    object_key: objectKey,
    original_filename: filename,
  };
}

// === Cleanup ===
export async function cleanupTestUser(db: Database, userId: string): Promise<void> {
  // CASCADE will handle files, reports, observations
  await db.query("DELETE FROM users WHERE id = $1", [userId]);
}

export async function cleanupTestFile(db: Database, fileId: string): Promise<void> {
  await db.query("DELETE FROM files WHERE id = $1", [fileId]);
}

// === Assertions Helpers ===
export async function getFileStatus(db: Database, fileId: string): Promise<string | null> {
  const result = await db.query(
    "SELECT status FROM files WHERE id = $1",
    [fileId]
  );
  return result.rows[0]?.status ?? null;
}

export async function getReportByFileId(db: Database, fileId: string): Promise<any | null> {
  const result = await db.query(
    "SELECT * FROM reports WHERE file_id = $1",
    [fileId]
  );
  return result.rows[0] ?? null;
}

export async function getObservationsByReportId(db: Database, reportId: string): Promise<any[]> {
  const result = await db.query(
    "SELECT * FROM observations WHERE report_id = $1",
    [reportId]
  );
  return result.rows;
}

// === PDF Fixture Path ===
// Note: This assumes tests are run from packages/worker directory
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PDF_FIXTURE_PATH = resolve(
  __dirname,
  "./fixtures/Resultado_LABORATORIO CLEMENTINO FRAGA_70005839058701.pdf"
);
