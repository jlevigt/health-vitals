import { Router } from "express";
import { db, logger, mailProvider } from "@/container.ts";
import { RequestRecoveryController } from "./controller.ts";
import { RequestRecoveryService } from "./service.ts";

const router = Router();

const service = new RequestRecoveryService(db, logger, mailProvider);
const controller = new RequestRecoveryController(service);

router.post("/", controller.handle);

export { router as requestRecoveryRouter };
