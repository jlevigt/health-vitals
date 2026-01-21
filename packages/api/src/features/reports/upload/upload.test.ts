import { describe, it, expect, mock, beforeAll, afterAll, spyOn } from "bun:test";
import request from "supertest";
import { createApp } from "@/app.ts";
import { pool } from "@/shared/db/index.ts";
import { llmProvider } from "@/container.ts";
import argon2 from "argon2";

const app = createApp();

describe("Report Upload Integration Tests", () => {
  const testEmail = `upload_test_${Date.now()}@example.com`;
  const testPassword = "password123";
  let accessToken: string | undefined;
  
  const agent = request.agent(app);

  beforeAll(async () => {
    // 1. Create user directly in DB
    const hash = await argon2.hash(testPassword);
    await pool.query(
      "INSERT INTO users (email, password_hash, is_active) VALUES ($1, $2, $3)",
      [testEmail, hash, true]
    );
    
    // 2. Login
    const loginRes = await agent.post("/auth/login").send({
      email: testEmail,
      password: testPassword
    });
    accessToken = loginRes.body.accessToken;

    // 3. Mock LLM Provider
    spyOn(llmProvider, "processDocument").mockImplementation(async () => {
      return {
        collection_date: "2024-01-18",
        lab_name: "Test Lab",
        observations: [
          {
            category: "lipid_panel",
            canonical_name: "total_cholesterol",
            raw_name: "Total Cholesterol",
            raw_value: "200",
            raw_unit: "mg/dL",
            normalized_value: 200,
            base_unit: "mg_dl",
            reference_high: 200
          }
        ]
      };
    });
  });

  mock.module("pdf-parse", () => {
    return {
      PDFParse: class {
        constructor() {}
        async getText() {
          return { text: "Extracted text" };
        }
        async destroy() {}
      }
    };
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  it("should upload a report successfully", async () => {
    // Create a dummy PDF buffer
    const dummyPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    const res = await agent
      .post("/reports/upload")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", dummyPdf, "test_report.pdf");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("reportId");
    expect(res.body.collectionDate).toBe("2024-01-18");
    expect(res.body.observationsCount).toBe(1);

    // Verify DB
    const reportRes = await pool.query("SELECT * FROM reports WHERE id = $1", [res.body.reportId]);
    expect(reportRes.rowCount).toBe(1);
    expect(reportRes.rows[0].lab_name).toBe("Test Lab");

    const obsRes = await pool.query("SELECT * FROM observations WHERE report_id = $1", [res.body.reportId]);
    expect(obsRes.rowCount).toBe(1);
    expect(obsRes.rows[0].canonical_name).toBe("total_cholesterol");
  });

  it("should fail if no file is provided", async () => {
    const res = await agent
      .post("/reports/upload")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("No file uploaded");
  });

  it("should fail if not authorized", async () => {
    const res = await agent
      .post("/reports/upload");

    expect(res.status).toBe(401);
  });
});
