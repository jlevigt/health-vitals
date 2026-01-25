import { Router } from "express";
import { db, logger } from "@/container.ts";
import { LogoutController } from "./controller.ts";
import { LogoutService } from "./service.ts";

const logoutRouter = Router();
const service = new LogoutService(db, logger);
const controller = new LogoutController(service);

logoutRouter.post("/", controller.handle);

export { logoutRouter };
