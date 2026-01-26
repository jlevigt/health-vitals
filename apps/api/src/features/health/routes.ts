import { Router } from "express";
import { HealthController } from "./controller.ts";

const healthRouter = Router();
const healthController = new HealthController();

healthRouter.get("/", healthController.handle);

export { healthRouter };
