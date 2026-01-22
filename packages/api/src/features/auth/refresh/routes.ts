import { Router } from "express";
import { db, logger } from "@/container.ts";
import { RefreshTokenController } from "./controller.ts";
import { RefreshTokenService } from "./service.ts";

const refreshRouter = Router();
const service = new RefreshTokenService(db, logger);
const controller = new RefreshTokenController(service);

refreshRouter.post("/", controller.handle);

export { refreshRouter };
