import { Router } from "express";
import { db, logger } from "@/container.ts";
import { AuthenticateUserController } from "./controller.ts";
import { AuthenticateUserService } from "./service.ts";

const router = Router();

const service = new AuthenticateUserService(db, logger);
const controller = new AuthenticateUserController(service);

router.post("/", controller.handle);

export { router as authenticateUserRouter };
