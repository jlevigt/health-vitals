// src/shared/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/shared/errors/app.error.ts";

interface IPayload {
  sub: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token missing", 401);
  }

  // Bearer <token>
  const [, token] = authHeader.split(" ");

  if (!process.env.SECRET_JWT_KEY) {
    throw new AppError("Internal server error: JWT Key not found", 500);
  }

  try {
    const { sub: userId } = jwt.verify(token, process.env.SECRET_JWT_KEY) as unknown as { sub: string };

    // Adiciona o ID do usuário ao objeto de requisição
    // É necessário estender o tipo Request do Express para fazer isso de forma type-safe
    // @ts-ignore
    req.user = {
      id: userId,
    };

    return next();
  } catch (err) {
    throw new AppError("Invalid token", 401);
  }
}
