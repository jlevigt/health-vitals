import { Request, Response } from "express";
import { ListReportsService } from "./service.ts";
import { AppError } from "@health-vitals/platform";

export class ListReportsController {
  constructor(private service: ListReportsService) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const result = await this.service.execute(userId);

    res.status(200).json(result);
  };
}
