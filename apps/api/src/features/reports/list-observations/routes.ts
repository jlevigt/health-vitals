import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { authMiddleware } from "@/shared/middlewares/auth.middleware.ts";
import { ListReportObservationsService } from "./service.ts";
import { ListReportObservationsController } from "./controller.ts";

const router = Router();

// === MANUAL DEPENDENCY INJECTION ===
const service = new ListReportObservationsService(pool);
const controller = new ListReportObservationsController(service);

// GET /reports/:id/observations
router.get("/:id/observations", authMiddleware, controller.handle);

export { router as listReportObservationsRouter };
