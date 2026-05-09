import type { Request, Response } from "express";
import { db, logger } from "@/container.ts";

export class HealthController {
  async handle(_req: Request, res: Response) {
    const healthcheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: Date.now(),
      db: "disconnected",
      memory: process.memoryUsage(),
    };

    try {
      await db.query("SELECT 1");
      healthcheck.db = "connected";
      res.status(200).json(healthcheck);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Health check DB query failed: ${errMsg}`);
      healthcheck.db = "disconnected";
      res.status(503).json(healthcheck);
    }
  }
}
