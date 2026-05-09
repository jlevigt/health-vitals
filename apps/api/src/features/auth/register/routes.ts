import { Router } from "express";
import { db, logger, mailProvider } from "@/container.ts";
import { CreateUserController } from "./controller.ts";
import { CreateUserService } from "./service.ts";

const router = Router();

const service = new CreateUserService(db, logger, mailProvider);
const controller = new CreateUserController(service);

router.post("/", controller.handle);

export { router as createUserRouter };
