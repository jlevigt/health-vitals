import { Router } from "express";
import { pool } from "@/shared/db/index.ts";
import { logger, mailProvider } from "@/container.ts"; // Pega do container global
import { CreateUserService } from "@/features/auth/register/service.ts";
import { CreateUserController } from "@/features/auth/register/controller.ts";

const router = Router();

// === INJEÇÃO DE DEPENDÊNCIA MANUAL (Composition Root Local) ===
// 1. Instancia o Service injetando o Pool, Logger e MailProvider
const service = new CreateUserService(pool, logger, mailProvider);

// 2. Instancia o Controller injetando o Service
const controller = new CreateUserController(service);

// 3. Define a rota
router.post("/", controller.handle);

export { router as createUserRouter };
