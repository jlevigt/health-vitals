import { describe, expect, it } from "bun:test";
import { FileStatus } from "@health-vitals/contracts";
import express from "express";
import request from "supertest";
import { buildOpenApiDocument } from "./openapi.ts";
import { docsRouter } from "./routes.ts";

function createDocsTestApp() {
  const app = express();
  app.use("/", docsRouter);
  return app;
}

describe("OpenAPI & Swagger UI Docs", () => {
  const app = createDocsTestApp();

  it("serves a valid OpenAPI 3.0.3 JSON specification at GET /openapi.json", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("Health Vitals API");
    expect(Array.isArray(res.body.servers)).toBe(true);
    expect(res.body.servers.map((s: { url: string }) => s.url)).toEqual([
      "https://api.binderlex.com",
      "http://localhost:3000",
    ]);
  });

  it("documents every implemented API endpoint and HTTP method", () => {
    const doc = buildOpenApiDocument() as {
      paths: Record<string, Record<string, unknown>>;
    };

    const expectedOperations: Array<[string, string]> = [
      ["/health", "get"],
      ["/auth/register", "post"],
      ["/auth/login", "post"],
      ["/auth/verify-email", "get"],
      ["/auth/verify-email", "post"],
      ["/auth/refresh", "post"],
      ["/auth/logout", "post"],
      ["/auth/password/recovery/request", "post"],
      ["/auth/password/reset", "post"],
      ["/auth/password/change", "post"],
      ["/files/uploads", "post"],
      ["/files/{file_id}/upload-complete", "post"],
      ["/files", "get"],
      ["/files/{file_id}", "delete"],
      ["/reports", "get"],
      ["/reports/{id}/observations", "get"],
      ["/dashboard/{category}", "get"],
    ];

    for (const [pathKey, method] of expectedOperations) {
      expect(doc.paths[pathKey]).toBeDefined();
      expect(doc.paths[pathKey]?.[method]).toBeDefined();
    }

    expect(Object.keys(doc.paths).length).toBe(16);
  });

  it("generates component schemas directly from @health-vitals/contracts Zod schemas", () => {
    const doc = buildOpenApiDocument() as {
      components: {
        securitySchemes: Record<string, unknown>;
        schemas: Record<string, Record<string, unknown>>;
      };
    };

    expect(doc.components.securitySchemes.bearerAuth).toBeDefined();
    expect(doc.components.securitySchemes.refreshCookie).toBeDefined();

    // Verify FileStatus enum values match @health-vitals/contracts exactly
    expect(doc.components.schemas.FileStatus?.enum).toEqual(Object.values(FileStatus));

    // Verify Zod min/max constraints propagate to RequestUploadBody
    const uploadFilesProp = (
      doc.components.schemas.RequestUploadBody?.properties as Record<
        string,
        Record<string, unknown>
      >
    )?.files;
    expect(uploadFilesProp?.minItems).toBe(1);
    expect(uploadFilesProp?.maxItems).toBe(10);

    // Verify DashboardCategory enum matches controller allow-list
    expect(doc.components.schemas.DashboardCategory?.enum).toEqual([
      "lipid_panel",
      "glucose_metabolism",
      "renal_function",
    ]);

    // Ensure no $schema metadata leaked into OpenAPI 3.0 component schemas
    for (const schema of Object.values(doc.components.schemas)) {
      expect(schema.$schema).toBeUndefined();
    }
  });

  it("does not leak environment secrets or internal credentials in /openapi.json", async () => {
    const res = await request(app).get("/openapi.json");
    const serialized = JSON.stringify(res.body);

    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("SECRET_JWT_KEY");
    expect(serialized).not.toContain("GEMINI_API_KEY");
    expect(serialized).not.toContain("RESEND_API_KEY");
    expect(serialized).not.toContain("STORAGE_SECRET_KEY");
  });

  it("serves Swagger UI HTML at GET /docs/ pointing to /openapi.json", async () => {
    const res = await request(app).get("/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("Health Vitals API Docs");
    expect(res.text).toContain('id="swagger-ui"');
    expect(res.text).toContain("swagger-ui-init.js");

    const initJs = await request(app).get("/docs/swagger-ui-init.js");
    expect(initJs.status).toBe(200);
    expect(initJs.text).toContain("/openapi.json");
  });
});
