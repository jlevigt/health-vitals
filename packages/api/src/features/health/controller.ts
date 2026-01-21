import { Request, Response } from "express";
import { pool } from "@/shared/db/index.ts";

export class HealthController {
  async handle(req: Request, res: Response) {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      db: 'disconnected',
      memory: process.memoryUsage()
    };

    try {
      await pool.query('SELECT 1');
      healthcheck.db = 'connected';
      res.status(200).json(healthcheck);
    } catch (error) {
      healthcheck.db = 'disconnected';
      res.status(503).json(healthcheck);
    }
  }
}
