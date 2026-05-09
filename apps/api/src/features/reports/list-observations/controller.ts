import { AppError } from "@health-vitals/platform";
import type { Request, Response } from "express";
import type { ListReportObservationsService } from "./service.ts";

export class ListReportObservationsController {
  constructor(private service: ListReportObservationsService) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { id: reportId } = req.params;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!reportId) {
      throw new AppError("Report ID is required.", 400);
    }

    const result = await this.service.execute(userId, reportId as string);

    res.status(200).json(result);
  };
}
