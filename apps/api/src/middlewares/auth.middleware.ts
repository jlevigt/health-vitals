// src/shared/middlewares/auth.middleware.ts

import { AppError } from "@health-vitals/platform";
import { env } from "@health-vitals/platform/config/env";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token missing", 401);
  }

  // Bearer <token>
  const [, token] = authHeader.split(" ");

  if (!env.SECRET_JWT_KEY) {
    throw new AppError("Internal server error: JWT Key not found", 500);
  }

  try {
    const { sub: userId } = jwt.verify(token, env.SECRET_JWT_KEY) as unknown as { sub: string };

    req.user = {
      id: userId,
    };

    return next();
  } catch (_err) {
    throw new AppError("Invalid token", 401);
  }
}
