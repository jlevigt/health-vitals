// src/features/users/authenticate-user/index.ts
import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { logger } from "@/container.ts";
import { AuthenticateUserService } from "./service.ts";
import { AuthenticateUserController } from "./controller.ts";

const router = Router();

// === INJEÇÃO DE DEPENDÊNCIA MANUAL ===
const service = new AuthenticateUserService(pool, logger);
const controller = new AuthenticateUserController(service);

router.post("/", controller.handle);

export { router as authenticateUserRouter };
