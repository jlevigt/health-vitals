import { Request, Response } from "express";
import { GetTrendsService } from "./service.ts";
import { AppError } from "@health-data/shared";

const ALLOWED_CATEGORIES = ['lipid_panel', 'glucose_metabolism', 'renal_function'];

export class GetTrendsController {
  constructor(private service: GetTrendsService) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const userId = req.user?.id;
    const category = req.params.category as string;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      throw new AppError("Invalid category", 400); 
    }

    const result = await this.service.execute(userId, category);

    res.status(200).json(result);
  };
}
