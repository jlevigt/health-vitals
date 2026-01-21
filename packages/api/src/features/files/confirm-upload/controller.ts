import { Request, Response, NextFunction } from "express";
import { ConfirmUploadService } from "./service.ts";
import { ConfirmUploadBodySchema } from "../types.ts";
import { pool } from "@/shared/db/index.ts";
import { logger } from "@/container.ts";
import { AppError } from "@/shared/errors/app.error.ts";

const service = new ConfirmUploadService(pool, logger);

export async function confirmUploadController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const { file_id } = req.params;
    if (!file_id) {
      throw new AppError("File ID is required", 400);
    }

    const parseResult = ConfirmUploadBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        `Invalid request body: ${parseResult.error.message}`,
        400
      );
    }

    const result = await service.execute(
      userId,
      file_id,
      parseResult.data.etag,
      parseResult.data.checksum
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
