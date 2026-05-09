import { AppError } from "@health-vitals/platform";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod"; // <--- Importe o ZodError

export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // 1. Tratamento de Erros de Validação (Zod) -> 400 Bad Request
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      // Formatamos o erro para mostrar qual campo falhou e por quê
      issues: err.issues.map((issue: any) => ({
        path: issue.path.join("."), // Ex: "address.zipcode"
        message: issue.message,
      })),
    });
  }

  // 2. Tratamento de Erros de Regra de Negócio (AppError) -> Status Dinâmico (400, 401, 404...)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      // Removemos o campo 'status'. O HTTP Code já diz tudo.
      message: err.message,
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};
