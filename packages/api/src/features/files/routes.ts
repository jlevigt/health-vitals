import { Router } from "express";
import { requestUploadRouter } from "./request-upload/routes.ts";
import { confirmUploadRouter } from "./confirm-upload/routes.ts";
import { listFilesRouter } from "./list/routes.ts";
import { authMiddleware } from "@/middlewares/auth.middleware.ts";

const router = Router();

// All file routes require authentication
router.use(authMiddleware);

// POST /files/uploads - Request signed URLs for file uploads
router.use("/uploads", requestUploadRouter);

// POST /files/:file_id/upload-complete - Confirm upload completed
router.use("/", confirmUploadRouter);

// GET /files - List user's files
router.use("/", listFilesRouter);

export { router as filesRouter };
