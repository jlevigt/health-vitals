import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { authMiddleware } from "@/shared/middlewares/auth.middleware.ts";
import { ListReportsService } from "./service.ts";
import { ListReportsController } from "./controller.ts";

const router = Router();

// === MANUAL DEPENDENCY INJECTION ===
const service = new ListReportsService(pool);
const controller = new ListReportsController(service);

// GET /reports
router.get("/", authMiddleware, controller.handle);

export { router as listReportsRouter };
