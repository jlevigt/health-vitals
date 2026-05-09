import type { Request, Response } from "express";
import { db, logger, storage, getQueue } from "@/container.ts";

export class HealthController {
  async handle(_req: Request, res: Response) {
    const healthcheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: Date.now(),
      db: "disconnected",
      storage: "disconnected",
      queue: "disconnected",
      memory: process.memoryUsage(),
    };

    let allHealthy = true;

    // 1. Check Database
    try {
      await db.query("SELECT 1");
      healthcheck.db = "connected";
    } catch (error) {
      logger.error(`Health check DB query failed: ${error}`);
      allHealthy = false;
    }

    // 2. Check Storage (S3/Minio)
    try {
      const storageHealthy = await storage.checkConnection();
      healthcheck.storage = storageHealthy ? "connected" : "disconnected";
      if (!storageHealthy) {
        allHealthy = false;
      }
    } catch (error) {
      logger.error(`Health check Storage failed: ${error}`);
      allHealthy = false;
    }

    // 3. Check Queue (RabbitMQ)
    try {
      const qConn = await getQueue();
      const queueHealthy = await qConn.channel.checkConnection();
      healthcheck.queue = queueHealthy ? "connected" : "disconnected";
      if (!queueHealthy) {
        allHealthy = false;
      }
    } catch (error) {
      logger.error(`Health check Queue failed: ${error}`);
      allHealthy = false;
    }

    if (allHealthy) {
      res.status(200).json(healthcheck);
    } else {
      healthcheck.message = "DEGRADED";
      res.status(503).json(healthcheck);
    }
  }
}
