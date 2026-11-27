import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type Subprocess, spawn } from "bun";
import { createDbPool, type Database } from "../../packages/platform/src/db/index.ts";

const API_PORT = Number(process.env.E2E_API_PORT || 3100);
const API_URL = `http://127.0.0.1:${API_PORT}`;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://local_user:local_password@127.0.0.1:5439/health_vitals_e2e";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@127.0.0.1:5672/";
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || "http://127.0.0.1:9000";

const MINIMAL_PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n", "utf-8");

async function waitForHealth(url: string, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.status === 200) {
        return;
      }
    } catch {
      // Server still booting
    }
    await Bun.sleep(250);
  }
  throw new Error(`API server at ${url}/health did not become healthy within ${timeoutMs}ms`);
}

const describeE2E = process.env.RUN_E2E === "true" ? describe : describe.skip;

describeE2E("Full-Stack System E2E (Live API + Postgres + RabbitMQ + MinIO)", () => {
  const testEmail = `e2e_${Date.now()}@binderlex.com`;
  const testPassword = "e2e-password-123";
  let serverProc: Subprocess | null = null;
  let db: Database;
  let accessToken = "";
  let refreshCookie = "";
  let uploadedFileId = "";

  beforeAll(async () => {
    db = createDbPool({ connectionString: DATABASE_URL });

    serverProc = spawn(["bun", "run", "--cwd", "apps/api", "src/server.ts"], {
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(API_PORT),
        WEB_URL: "http://localhost:5173",
        DATABASE_URL,
        RABBITMQ_URL,
        STORAGE_ENDPOINT,
        STORAGE_REGION: "us-east-1",
        STORAGE_ACCESS_KEY: "minioadmin",
        STORAGE_SECRET_KEY: "minioadmin",
        STORAGE_BUCKET: "health-vitals-uploads",
        SECRET_JWT_KEY: "e2e-secret-jwt-key-1234567890",
        MAIL_PROVIDER: "mock",
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    await waitForHealth(API_URL);
  });

  afterAll(async () => {
    if (serverProc) {
      serverProc.kill();
      await serverProc.exited;
    }
    await db.query("DELETE FROM users WHERE email = $1", [testEmail]);
    await db.end();
  });

  it("GET /health reports db, storage, and queue all connected", async () => {
    const res = await fetch(`${API_URL}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      message: string;
      db: string;
      storage: string;
      queue: string;
    };
    expect(body.message).toBe("OK");
    expect(body.db).toBe("connected");
    expect(body.storage).toBe("connected");
    expect(body.queue).toBe("connected");
  });

  it("registers user, activates account, and logs in with JWT + HttpOnly refresh cookie", async () => {
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    expect(regRes.status).toBe(201);

    // Confirm user + verification token were persisted in Postgres
    const userRes = await db.query("SELECT id, is_active FROM users WHERE email = $1", [testEmail]);
    expect(userRes.rowCount).toBe(1);
    expect(userRes.rows[0].is_active).toBe(false);

    const verRes = await db.query(
      "SELECT id, expires_at FROM email_verifications WHERE user_id = $1",
      [userRes.rows[0].id],
    );
    expect(verRes.rowCount).toBe(1);

    // Activate user (simulating email link click) and login
    await db.query("UPDATE users SET is_active = true WHERE id = $1", [userRes.rows[0].id]);

    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = (await loginRes.json()) as {
      accessToken: string;
      user: { id: string; email: string };
    };
    expect(loginBody.accessToken).toBeTruthy();
    expect(loginBody.user.email).toBe(testEmail);
    accessToken = loginBody.accessToken;

    const setCookie = loginRes.headers.get("set-cookie") || "";
    expect(setCookie).toContain("refreshToken=");
    expect(setCookie).toContain("HttpOnly");
    refreshCookie = setCookie.split(";")[0] ?? "";
  });

  it("requests presigned URL, uploads real PDF to MinIO, confirms upload, and lists file cleanly", async () => {
    // 1. Request presigned S3 upload URL
    const reqUploadRes = await fetch(`${API_URL}/files/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        files: [
          {
            original_filename: "e2e_lipid_panel.pdf",
            size_bytes: MINIMAL_PDF.byteLength,
            content_type: "application/pdf",
          },
        ],
      }),
    });
    expect(reqUploadRes.status).toBe(201);
    const uploadData = (await reqUploadRes.json()) as {
      files: Array<{ file_id: string; upload_url: string }>;
    };
    expect(uploadData.files).toHaveLength(1);
    uploadedFileId = uploadData.files[0].file_id;
    const uploadUrl = uploadData.files[0].upload_url;

    // 2. Upload real PDF bytes directly to MinIO via the presigned URL
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: MINIMAL_PDF,
    });
    expect(putRes.ok).toBe(true);

    // 3. Confirm upload (verifies object in MinIO + publishes job to RabbitMQ)
    const completeRes = await fetch(`${API_URL}/files/${uploadedFileId}/upload-complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });
    expect(completeRes.status).toBe(200);
    const completeBody = (await completeRes.json()) as { file_id: string; status: string };
    expect(completeBody.file_id).toBe(uploadedFileId);
    expect(completeBody.status).toBe("QUEUED");

    // 4. List files — verifies non-double-wrapped { files: [...] } contract
    const listRes = await fetch(`${API_URL}/files`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      files: Array<{ id: string; filename: string; status: string }>;
    };
    expect(Array.isArray(listBody.files)).toBe(true);
    expect(listBody.files.some((f) => f.id === uploadedFileId && f.status === "QUEUED")).toBe(true);
  });

  it("serves dashboard trends, lab reports, token refresh, and logout cleanly", async () => {
    const dashRes = await fetch(`${API_URL}/dashboard/lipid_panel`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(dashRes.status).toBe(200);
    const dashBody = (await dashRes.json()) as { category: string; series: unknown[] };
    expect(dashBody.category).toBe("lipid_panel");
    expect(Array.isArray(dashBody.series)).toBe(true);

    const reportsRes = await fetch(`${API_URL}/reports`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(reportsRes.status).toBe(200);
    expect(Array.isArray(await reportsRes.json())).toBe(true);

    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: refreshCookie },
    });
    expect(refreshRes.status).toBe(200);
    const refreshBody = (await refreshRes.json()) as { accessToken: string };
    expect(refreshBody.accessToken).toBeTruthy();

    const logoutRes = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Cookie: refreshCookie },
    });
    expect(logoutRes.status).toBe(200);
  });
});
