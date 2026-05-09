import { passwordResetSchema } from "@health-vitals/contracts";
import type { Request, Response } from "express";
import type { ResetPasswordService } from "./service.ts";

export class ResetPasswordController {
  constructor(private service: ResetPasswordService) {}

  handle = async (req: Request, res: Response) => {
    const data = passwordResetSchema.parse(req.body);
    await this.service.execute(data);

    return res.status(200).json({ message: "Password reset successfully." });
  };
}
