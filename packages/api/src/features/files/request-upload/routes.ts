import { Router } from "express";
import { requestUploadController } from "./controller.ts";

const router = Router();

router.post("/", requestUploadController);

export { router as requestUploadRouter };
