import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { authMiddleware } from "@/shared/middlewares/auth.middleware.ts";
import { GetTrendsService } from "./service.ts";
import { GetTrendsController } from "./controller.ts";

const router = Router();

// === MANUAL DEPENDENCY INJECTION ===
const service = new GetTrendsService(pool);
const controller = new GetTrendsController(service);

// GET /dashboard/:category
router.get("/:category", authMiddleware, controller.handle);

export { router as dashboardRouter };
