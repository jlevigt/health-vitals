import { Request, Response, NextFunction } from "express";
import { ListFilesService } from "./service.ts";
import { ListFilesQuerySchema } from "../types.ts";
import { pool } from "@/shared/db/index.ts";
import { logger } from "@/container.ts";
import { AppError } from "@/shared/errors/app.error.ts";

const service = new ListFilesService(pool, logger);

export async function listFilesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const parseResult = ListFilesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      throw new AppError(
        `Invalid query parameters: ${parseResult.error.message}`,
        400
      );
    }

    const result = await service.execute(userId, parseResult.data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
