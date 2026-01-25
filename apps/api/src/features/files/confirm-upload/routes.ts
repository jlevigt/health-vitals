import { Router } from "express";
import { confirmUploadController } from "./controller.ts";

const router = Router();

router.post("/:file_id/upload-complete", confirmUploadController);

export { router as confirmUploadRouter };
