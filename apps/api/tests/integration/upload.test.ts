import { describe, it, expect, beforeAll, afterAll, spyOn } from "bun:test";
import request from "supertest";
import { createApp } from "@/app.ts";
import { db, storage, getQueue } from "@/container.ts";
import argon2 from "argon2";
import { FileStatus } from "@health-vitals/contracts";

const app = createApp();

describe("File Upload Integration Tests", () => {
  const testEmail = `upload_test_${Date.now()}@example.com`;
  const testPassword = "password123";
  let accessToken: string | undefined;
  let testFileId: string | undefined;
  
  const agent = request.agent(app);

  beforeAll(async () => {
    // 1. Create user directly in DB
    const hash = await argon2.hash(testPassword);
    await db.query(
      "INSERT INTO users (email, password_hash, is_active) VALUES ($1, $2, $3)",
      [testEmail, hash, true]
    );
    
    // 2. Login
    const loginRes = await agent.post("/auth/login").send({
      email: testEmail,
      password: testPassword
    });
    accessToken = loginRes.body.accessToken;

    // 3. Mock storage provider to return fake signed URLs
    spyOn(storage, "getSignedUploadUrl").mockImplementation(
      async (_bucket: string, objectKey: string, _expiresIn: number, _contentType?: string) => {
        return `https://fake-storage.example.com/upload/${objectKey}?signature=fake`;
      }
    );
  });

  afterAll(async () => {
    // Cleanup: delete test user (cascades to files)
    await db.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  describe("POST /files/uploads - Request Upload URLs", () => {
    it("should return signed upload URLs for requested files", async () => {
      const res = await agent
        .post("/files/uploads")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          files: [
            {
              original_filename: "test_report.pdf",
              size_bytes: 1024 * 1024, // 1MB
              content_type: "application/pdf"
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("files");
      expect(res.body.files).toHaveLength(1);
      
      const file = res.body.files[0];
      expect(file).toHaveProperty("file_id");
      expect(file).toHaveProperty("object_key");
      expect(file).toHaveProperty("upload_url");
      expect(file).toHaveProperty("expires_at");
      expect(file.upload_url).toContain("https://fake-storage.example.com/upload/");
      
      // Store file_id for subsequent tests
      testFileId = file.file_id;

      // Verify file record was created in DB with CREATED status
      const dbResult = await db.query(
        "SELECT * FROM files WHERE id = $1",
        [testFileId]
      );
      expect(dbResult.rowCount).toBe(1);
      expect(dbResult.rows[0].status).toBe(FileStatus.CREATED);
      expect(dbResult.rows[0].original_filename).toBe("test_report.pdf");
    });

    it("should support multiple files in a single request", async () => {
      const res = await agent
        .post("/files/uploads")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          files: [
            { original_filename: "report1.pdf", size_bytes: 512 * 1024, content_type: "application/pdf" },
            { original_filename: "report2.pdf", size_bytes: 768 * 1024, content_type: "application/pdf" },
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.files).toHaveLength(2);
      expect(res.body.files[0].file_id).not.toBe(res.body.files[1].file_id);
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post("/files/uploads")
        .send({
          files: [{ original_filename: "test.pdf", size_bytes: 1024, content_type: "application/pdf" }]
        });

      expect(res.status).toBe(401);
    });

    it("should reject files exceeding size limit", async () => {
      const res = await agent
        .post("/files/uploads")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          files: [
            {
              original_filename: "huge_file.pdf",
              size_bytes: 100 * 1024 * 1024, // 100MB - exceeds 50MB limit
              content_type: "application/pdf"
            }
          ]
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /files/:file_id/upload-complete - Confirm Upload", () => {
    let confirmFileId: string;

    beforeAll(async () => {
      // Create a fresh file for confirm tests
      const res = await agent
        .post("/files/uploads")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          files: [
            { original_filename: "confirm_test.pdf", size_bytes: 1024, content_type: "application/pdf" }
          ]
        });
      confirmFileId = res.body.files[0].file_id;
    });

    it("should transition file status to QUEUED", async () => {
      // Mock queue publish to avoid actual RabbitMQ connection
      const queue = await getQueue();
      spyOn(queue.channel, "sendToQueue").mockImplementation(() => true);

      const res = await agent
        .post(`/files/${confirmFileId}/upload-complete`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ etag: "abc123" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("file_id", confirmFileId);
      expect(res.body).toHaveProperty("status", FileStatus.QUEUED);

      // Verify DB was updated
      const dbResult = await db.query(
        "SELECT status, enqueued_at FROM files WHERE id = $1",
        [confirmFileId]
      );
      expect(dbResult.rows[0].status).toBe(FileStatus.QUEUED);
      expect(dbResult.rows[0].enqueued_at).not.toBeNull();
    });

    it("should fail to confirm a non-existent file", async () => {
      const res = await agent
        .post("/files/00000000-0000-0000-0000-000000000000/upload-complete")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it("should fail to confirm an already confirmed file", async () => {
      const res = await agent
        .post(`/files/${confirmFileId}/upload-complete`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Cannot confirm upload");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/files/${confirmFileId}/upload-complete`)
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe("GET /files - List Files", () => {
    it("should list user's files", async () => {
      const res = await agent
        .get("/files")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.files)).toBe(true);
      // Should have at least the files we created in tests
      expect(res.body.files.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter files by status", async () => {
      const res = await agent
        .get("/files")
        .query({ status: FileStatus.QUEUED })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.files)).toBe(true);
      // All returned files should have QUEUED status
      for (const file of res.body.files) {
        expect(file.status).toBe(FileStatus.QUEUED);
      }
    });

    it("should fail without authentication", async () => {
      const res = await request(app).get("/files");

      expect(res.status).toBe(401);
    });
  });
});
