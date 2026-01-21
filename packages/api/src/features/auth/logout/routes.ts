import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { logger } from "@/container.ts";
import { LogoutController } from "./controller.ts";
import { LogoutService } from "./service.ts";

const logoutRouter = Router();
const service = new LogoutService(pool, logger);
const controller = new LogoutController(service);

logoutRouter.post("/", controller.handle);

export { logoutRouter };
