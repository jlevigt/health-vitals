import { Request, Response, NextFunction } from "express";
import { ConfirmUploadService } from "./service.ts";
import { ConfirmUploadBodySchema } from "../types.ts";
import { db, logger, getQueue } from "@/container.ts";
import { AppError } from "@health-data/shared";

const service = new ConfirmUploadService(db, logger, async () => {
  const queue = await getQueue();
  return queue.channel;
});

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
