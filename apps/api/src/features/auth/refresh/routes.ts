import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { logger } from "@/container.ts";
import { RefreshTokenController } from "./controller.ts";
import { RefreshTokenService } from "./service.ts";

const refreshRouter = Router();
const service = new RefreshTokenService(pool, logger);
const controller = new RefreshTokenController(service);

refreshRouter.post("/", controller.handle);

export { refreshRouter };
