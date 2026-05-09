import { afterAll, beforeAll, describe, expect, it, spyOn } from "bun:test";
import request from "supertest";
import { createApp } from "@/app.ts";
import { db, mailProvider } from "@/container.ts";

const app = createApp();

describe("Auth Integration Tests", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "password123";
  let verificationToken: string | undefined;

  // Use agent to persist cookies
  const agent = request.agent(app);

  beforeAll(async () => {
    await db.query("DELETE FROM users WHERE email = $1", [testEmail]);

    spyOn(mailProvider, "sendMail").mockImplementation(
      async (_to: string, _subject: string, body: string) => {
        const match = body.match(/token=([a-f0-9]+)/);
        if (match) {
          verificationToken = match[1];
        }
      },
    );
  });

  afterAll(async () => {
    await db.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  it("should register a new user and send verification email", async () => {
    const res = await agent.post("/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(201);
  });

  it("should verify email with valid token", async () => {
    const res = await agent.get("/auth/verify-email").query({
      token: verificationToken,
      email: testEmail,
    });
    expect(res.status).toBe(200);
  });

  it("should login successfully and return accessToken in body with refreshToken in HttpOnly cookie", async () => {
    const res = await agent.post("/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).not.toHaveProperty("refreshToken"); // Should NOT be in body
    expect(res.body).toHaveProperty("user");

    // Verify refreshToken is in HttpOnly cookie
    const cookies = res.headers["set-cookie"] as string[] | string | undefined;
    expect(cookies).toBeDefined();
    const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
    expect(cookieArray.some((c: string) => c.includes("refreshToken"))).toBe(true);
    expect(cookieArray.some((c: string) => c.includes("HttpOnly"))).toBe(true);
  });

  it("should refresh token successfully using refreshToken from cookie", async () => {
    // Agent sends cookies automatically
    const res = await agent.post("/auth/refresh").send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).not.toHaveProperty("refreshToken"); // Should NOT be in body

    // Verify new refreshToken is set in cookie
    const cookies = res.headers["set-cookie"] as string[] | string | undefined;
    expect(cookies).toBeDefined();
    const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
    expect(cookieArray.some((c: string) => c.includes("refreshToken"))).toBe(true);
  });

  it("should logout successfully", async () => {
    // Agent sends cookies automatically
    const res = await agent.post("/auth/logout").send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out successfully");

    // Verify refreshToken cookie is cleared
    const cookies = res.headers["set-cookie"] as string[] | string | undefined;
    const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
    expect(cookieArray.some((c: string) => c.includes("refreshToken=;"))).toBe(true);
  });

  it("should fail to refresh after logout", async () => {
    // Agent should have cleared cookies after logout
    const res = await agent.post("/auth/refresh").send();

    // Should be 401 because refreshToken cookie is missing or invalid
    expect(res.status).toBe(401);
  });
});
