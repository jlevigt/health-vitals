import { AppError, ValidationError } from "@health-vitals/platform";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { db, logger, storage } from "@/container.ts";
import { DeleteFileService } from "./service.ts";

const fileIdParamSchema = z.object({
  file_id: z.string().uuid("Invalid file ID"),
});

const service = new DeleteFileService(db, storage, logger);

export async function deleteFileController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const parsed = fileIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Invalid file ID");
    }

    const result = await service.execute(userId, parsed.data.file_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
