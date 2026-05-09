import type { Request, Response } from "express";
import type { RefreshTokenService } from "./service.ts";

export class RefreshTokenController {
  constructor(private service: RefreshTokenService) {}

  handle = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    // Validate existence before service call
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.service.execute({
      refreshToken,
    });

    // Set new refreshToken in HttpOnly cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return accessToken in response body
    return res.status(200).json({
      accessToken,
    });
  };
}
