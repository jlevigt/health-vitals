import { Router } from "express";
import { db } from "@/container.ts";
import { authMiddleware } from "@/middlewares/auth.middleware.ts";
import { ListReportObservationsService } from "./service.ts";
import { ListReportObservationsController } from "./controller.ts";

const router = Router();

const service = new ListReportObservationsService(db);
const controller = new ListReportObservationsController(service);

// GET /reports/:id/observations
router.get("/:id/observations", authMiddleware, controller.handle);

export { router as listReportObservationsRouter };
