import { Router } from "express";
import { db, logger } from "@/container.ts";
import { VerifyEmailController } from "./controller.ts";
import { VerifyEmailService } from "./service.ts";

const verifyEmailRouter = Router();
const service = new VerifyEmailService(db, logger);
const controller = new VerifyEmailController(service);

// Supports GET (link click) and POST (manual submit)
verifyEmailRouter.get("/", controller.handle);
verifyEmailRouter.post("/", controller.handle);

export { verifyEmailRouter };
