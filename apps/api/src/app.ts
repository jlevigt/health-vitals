import express from "express";
import cookieParser from "cookie-parser";
import { routes } from "@/routes.ts";
import { errorMiddleware } from "@/shared/middlewares/error.middleware.ts";
import { httpLogger } from "@/shared/middlewares/http.logger.ts";
import cors from "cors";

export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }));
  app.use(httpLogger);
  app.use(express.json());
  app.use(cookieParser());

  app.use(routes);

  app.use(errorMiddleware);

  return app;
};

