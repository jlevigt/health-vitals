import { AppError } from "@health-vitals/platform";
import type { NextFunction, Request, Response } from "express";
import { db, logger, storage } from "@/container.ts";
import { RequestUploadBodySchema } from "@health-vitals/contracts";
import { RequestUploadService } from "./service.ts";

const service = new RequestUploadService(db, storage, logger);

export async function requestUploadController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const parseResult = RequestUploadBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(`Invalid request body: ${parseResult.error.message}`, 400);
    }

    const result = await service.execute(userId, parseResult.data.files);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
