import { Router } from "express";
import { db, logger } from "@/container.ts";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { ChangePasswordController } from "./controller.ts";
import { ChangePasswordService } from "./service.ts";

const router = Router();

const service = new ChangePasswordService(db, logger);
const controller = new ChangePasswordController(service);

router.post("/", authMiddleware, controller.handle);

export { router as changePasswordRouter };
