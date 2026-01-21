import { Request, Response } from "express";
import { UploadReportService } from "./service.ts";
import { AppError } from "@/shared/errors/app.error.ts";

export class UploadReportController {
  constructor(private uploadReportService: UploadReportService) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!file) {
      throw new AppError("No file uploaded.", 400);
    }

    if (file.mimetype !== "application/pdf") {
      throw new AppError("Only PDF files are allowed.", 400);
    }

    const result = await this.uploadReportService.execute(
      userId,
      file.buffer,
      file.originalname
    );

    res.status(201).json(result);
  };
}
