import { Router } from "express";
import { deleteFileController } from "./controller.ts";

const router = Router();

router.delete("/:file_id", deleteFileController);

export { router as deleteFileRouter };
