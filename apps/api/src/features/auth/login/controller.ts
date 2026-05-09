// src/features/users/authenticate-user/authenticate-user.controller.ts

import { authenticateUserSchema } from "@health-vitals/contracts";
import type { Request, Response } from "express";
import type { AuthenticateUserService } from "./service.ts";

export class AuthenticateUserController {
  constructor(private service: AuthenticateUserService) {}

  handle = async (req: Request, res: Response) => {
    const data = authenticateUserSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await this.service.execute(data);

    // Set refreshToken in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth", // Limit scope
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return accessToken in response body
    return res.status(200).json({
      user,
      accessToken,
    });
  };
}
