import { describe, expect, it, mock } from "bun:test";
import type { Database, Logger } from "@health-vitals/platform";
import { AppError, MockMailProvider } from "@health-vitals/platform";
import { CreateUserService } from "./service.ts";

function createLoggerMock(): Logger {
  const logger: Logger = {
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    debug: mock(() => {}),
    child: mock(() => logger),
  };
  return logger;
}

describe("CreateUserService (branded verification email)", () => {
  it("sends branded HTML + plain-text email with URL-encoded verification link", async () => {
    const queries: string[] = [];
    const client = {
      query: mock(async (sql: string) => {
        queries.push(sql.trim());
        if (sql.includes("SELECT id FROM users")) {
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO users")) {
          return { rows: [{ id: "user-123", email: "ana+lab@binderlex.com" }] };
        }
        return { rows: [] };
      }),
      release: mock(() => {}),
    };
    const db = {
      connect: mock(async () => client),
    } as unknown as Database;

    const mailProvider = new MockMailProvider();
    const service = new CreateUserService(db, createLoggerMock(), mailProvider);

    const user = await service.execute({
      email: "ana+lab@binderlex.com",
      password: "secure-password-123",
    });

    expect(user.id).toBe("user-123");
    expect(queries).toContain("BEGIN");
    expect(queries).toContain("COMMIT");
    expect(mailProvider.sentEmails).toHaveLength(1);

    const sent = mailProvider.sentEmails[0];
    expect(sent?.to).toBe("ana+lab@binderlex.com");
    expect(sent?.subject).toContain("HealthVitals");
    expect(sent?.body).toContain("<!DOCTYPE html");
    expect(sent?.body).toContain("email=ana%2Blab%40binderlex.com");
    expect(sent?.body).toContain("24");
    expect(sent?.text).toBeDefined();
    expect(sent?.text).toContain("email=ana%2Blab%40binderlex.com");
    expect(sent?.text).toContain("HealthVitals");
  });

  it("rolls back transaction and skips email when user already exists", async () => {
    const queries: string[] = [];
    const client = {
      query: mock(async (sql: string) => {
        queries.push(sql.trim());
        if (sql.includes("SELECT id FROM users")) {
          return { rows: [{ id: "existing-id" }] };
        }
        return { rows: [] };
      }),
      release: mock(() => {}),
    };
    const db = {
      connect: mock(async () => client),
    } as unknown as Database;

    const mailProvider = new MockMailProvider();
    const service = new CreateUserService(db, createLoggerMock(), mailProvider);

    await expect(
      service.execute({
        email: "existing@binderlex.com",
        password: "secure-password-123",
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(queries).toContain("ROLLBACK");
    expect(mailProvider.sentEmails).toHaveLength(0);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
