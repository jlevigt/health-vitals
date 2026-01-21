import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { logger } from "@/container.ts";
import { VerifyEmailController } from "./controller.ts";
import { VerifyEmailService } from "./service.ts";

const verifyEmailRouter = Router();
const service = new VerifyEmailService(pool, logger);
const controller = new VerifyEmailController(service);

// Suporta GET (clique no link) e POST (envio manual)
verifyEmailRouter.get("/", controller.handle);
verifyEmailRouter.post("/", controller.handle);

export { verifyEmailRouter };
