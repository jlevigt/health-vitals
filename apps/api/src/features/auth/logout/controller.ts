import { Request, Response } from "express";
import { LogoutService } from "./service.ts";

export class LogoutController {
  constructor(private service: LogoutService) {}

  handle = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
        await this.service.execute({ refreshToken });
    }

    // Clear refreshToken cookie
    res.clearCookie("refreshToken", { path: "/auth" });
    
    return res.status(200).json({ message: "Logged out successfully" });
  };
}
