import { Request, Response, NextFunction } from "express";
import { RequestUploadService } from "./service.ts";
import { RequestUploadBodySchema } from "../types.ts";
import { pool } from "@/shared/db/index.ts";
import { logger } from "@/container.ts";
import { AppError } from "@/shared/errors/app.error.ts";

const service = new RequestUploadService(pool, logger);

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
