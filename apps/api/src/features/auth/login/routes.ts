import { Router } from "express";
import { db, logger } from "@/container.ts";
import { AuthenticateUserService } from "./service.ts";
import { AuthenticateUserController } from "./controller.ts";

const router = Router();

const service = new AuthenticateUserService(db, logger);
const controller = new AuthenticateUserController(service);

router.post("/", controller.handle);

export { router as authenticateUserRouter };
