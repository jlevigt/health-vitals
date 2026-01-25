import { Router } from "express";
import { db } from "@/container.ts";
import { authMiddleware } from "@/middlewares/auth.middleware.ts";
import { GetTrendsService } from "./service.ts";
import { GetTrendsController } from "./controller.ts";

const router = Router();

const service = new GetTrendsService(db);
const controller = new GetTrendsController(service);

// GET /dashboard/:category
router.get("/:category", authMiddleware, controller.handle);

export { router as dashboardRouter };
