import { Router } from "express";
import { db, logger } from "@/container.ts";
import { ResetPasswordController } from "./controller.ts";
import { ResetPasswordService } from "./service.ts";

const router = Router();

const service = new ResetPasswordService(db, logger);
const controller = new ResetPasswordController(service);

router.post("/", controller.handle);

export { router as resetPasswordRouter };
