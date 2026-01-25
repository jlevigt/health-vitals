import { Router } from "express";
import multer from "multer";
import { pool } from "@/shared/db/index.ts";
import { logger, llmProvider } from "@/container.ts";
import { authMiddleware } from "@/middlewares/auth.middleware.ts";
import { UploadReportService } from "./service.ts";
import { UploadReportController } from "./controller.ts";

const router = Router();

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// === MANUAL DEPENDENCY INJECTION ===
const service = new UploadReportService(pool, logger, llmProvider);
const controller = new UploadReportController(service);

// POST /reports/upload
router.post("/", authMiddleware, upload.single("file"), controller.handle);

export { router as uploadReportRouter };
