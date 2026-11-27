import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware.ts";
import { confirmUploadRouter } from "./confirm-upload/routes.ts";
import { deleteFileRouter } from "./delete/routes.ts";
import { listFilesRouter } from "./list/routes.ts";
import { requestUploadRouter } from "./request-upload/routes.ts";

const router = Router();

// All file routes require authentication
router.use(authMiddleware);

// POST /files/uploads - Request signed URLs for file uploads
router.use("/uploads", requestUploadRouter);

// POST /files/:file_id/upload-complete - Confirm upload completed
router.use("/", confirmUploadRouter);

// DELETE /files/:file_id - Delete file and cascade associated reports & observations
router.use("/", deleteFileRouter);

// GET /files - List user's files
router.use("/", listFilesRouter);

export { router as filesRouter };
