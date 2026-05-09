import { AppError } from "@health-vitals/platform";
import type { NextFunction, Request, Response } from "express";
import { db, getQueue, logger } from "@/container.ts";
import { ConfirmUploadBodySchema } from "@health-vitals/contracts";
import { ConfirmUploadService } from "./service.ts";

const service = new ConfirmUploadService(db, logger, async () => {
  const queue = await getQueue();
  return queue.channel;
});

export async function confirmUploadController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const { file_id } = req.params as { file_id: string };
    if (!file_id) {
      throw new AppError("File ID is required", 400);
    }

    const parseResult = ConfirmUploadBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(`Invalid request body: ${parseResult.error.message}`, 400);
    }

    const result = await service.execute(
      userId,
      file_id,
      parseResult.data.etag,
      parseResult.data.checksum,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
