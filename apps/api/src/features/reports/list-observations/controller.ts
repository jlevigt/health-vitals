import { Request, Response } from "express";
import { ListReportObservationsService } from "./service.ts";
import { AppError } from "@health-vitals/platform";

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
