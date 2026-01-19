import { Request, Response } from "express";
import { CreateUserService } from "@/features/auth/register/service.ts";
import { createUserSchema } from "@/features/auth/register/types.ts";

export class CreateUserController {
  constructor(private service: CreateUserService) {}

  // Arrow function para evitar problemas com 'this'
  handle = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);
    const user = await this.service.execute(data);
    return res.status(201).json(user);
  };
}
