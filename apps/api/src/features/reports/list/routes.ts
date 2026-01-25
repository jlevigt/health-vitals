import { Router } from "express";
import { db } from "@/container.ts";
import { authMiddleware } from "@/middlewares/auth.middleware.ts";
import { ListReportsService } from "./service.ts";
import { ListReportsController } from "./controller.ts";

const router = Router();

const service = new ListReportsService(db);
const controller = new ListReportsController(service);

// GET /reports
router.get("/", authMiddleware, controller.handle);

export { router as listReportsRouter };
