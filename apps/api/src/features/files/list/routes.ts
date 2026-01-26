import { Router } from "express";
import { listFilesController } from "./controller.ts";

const router = Router();

router.get("/", listFilesController);

export { router as listFilesRouter };
