import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { AppError } from "@health-vitals/platform";
import type { NextFunction, Request, Response } from "express";
import { listFilesController } from "./controller.ts";
import { ListFilesService } from "./service.ts";

function createMockResponse() {
  const res = {
    status: mock(() => res),
    json: mock(() => res),
  } as unknown as Response;
  return res;
}

describe("listFilesController", () => {
  beforeEach(() => {
    mock.restore();
  });

  it("returns { files: [...] } directly without double-wrapping", async () => {
    const mockFiles = [
      {
        id: "file-1",
        filename: "lab-report.pdf",
        status: "SUCCEEDED" as const,
        created_at: "2026-11-27T12:00:00.000Z",
        processed_at: "2026-11-27T12:01:00.000Z",
      },
    ];
    spyOn(ListFilesService.prototype, "execute").mockResolvedValue({ files: mockFiles });

    const req = { user: { id: "user-1" }, query: {} } as unknown as Request;
    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await listFilesController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ files: mockFiles });
    expect(next).not.toHaveBeenCalled();
  });

  it("passes 401 AppError to next when user is missing", async () => {
    const req = { query: {} } as unknown as Request;
    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await listFilesController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as ReturnType<typeof mock>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it("passes 400 AppError to next when query status is invalid", async () => {
    const req = {
      user: { id: "user-1" },
      query: { status: "INVALID_STATUS" },
    } as unknown as Request;
    const res = createMockResponse();
    const next = mock(() => {}) as unknown as NextFunction;

    await listFilesController(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as ReturnType<typeof mock>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });
});
