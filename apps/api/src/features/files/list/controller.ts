import { Request, Response, NextFunction } from "express";
import { ListFilesService } from "./service.ts";
import { ListFilesQuerySchema } from "../types.ts";
import { db, logger } from "@/container.ts";
import { AppError } from "@health-vitals/infra";

const service = new ListFilesService(db, logger);

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
    res.status(200).json({ files: result });
  } catch (error) {
    next(error);
  }
}
