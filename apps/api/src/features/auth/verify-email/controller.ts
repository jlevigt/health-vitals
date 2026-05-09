import { verifyEmailSchema } from "@health-vitals/contracts";
import type { Request, Response } from "express";
import type { VerifyEmailService } from "./service.ts";

export class VerifyEmailController {
  constructor(private service: VerifyEmailService) {}

  handle = async (req: Request, res: Response) => {
    // Pode vir via query params (link do email) ou body
    const payload = req.method === "GET" ? req.query : req.body;

    const data = verifyEmailSchema.parse(payload);
    const result = await this.service.execute(data);

    return res.status(200).json(result);
  };
}
