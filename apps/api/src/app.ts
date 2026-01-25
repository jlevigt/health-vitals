import express from "express";
import cookieParser from "cookie-parser";
import { routes } from "@/routes.ts";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { httpLogger } from "@/middlewares/http.logger";
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

