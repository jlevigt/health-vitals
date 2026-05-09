import { passwordChangeSchema } from "@health-vitals/contracts";
import { UnauthorizedError } from "@health-vitals/platform";
import type { Request, Response } from "express";
import type { ChangePasswordService } from "./service.ts";

export class ChangePasswordController {
  constructor(private service: ChangePasswordService) {}

  handle = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const data = passwordChangeSchema.parse(req.body);
    await this.service.execute(userId, data);

    return res.status(200).json({ message: "Password changed successfully." });
  };
}
