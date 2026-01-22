import { Request, Response, NextFunction } from "express";
import { RequestUploadService } from "./service.ts";
import { RequestUploadBodySchema } from "../types.ts";
import { db, storage, logger } from "@/container.ts";
import { AppError } from "@health-data/shared";

const service = new RequestUploadService(db, storage, logger);

export async function requestUploadController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const parseResult = RequestUploadBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        `Invalid request body: ${parseResult.error.message}`,
        400
      );
    }

    const result = await service.execute(userId, parseResult.data.files);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
