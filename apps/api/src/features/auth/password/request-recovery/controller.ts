import { passwordRecoveryRequestSchema } from "@health-vitals/contracts";
import type { Request, Response } from "express";
import type { RequestRecoveryService } from "./service.ts";

export class RequestRecoveryController {
  constructor(private service: RequestRecoveryService) {}

  handle = async (req: Request, res: Response) => {
    const data = passwordRecoveryRequestSchema.parse(req.body);
    await this.service.execute(data);

    return res.status(200).json({
      message: "If an account exists with that email, a recovery link has been sent.",
    });
  };
}
