import express from "express";
import cookieParser from "cookie-parser";
import { routes } from "@/routes.ts";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { httpLogger } from "@/middlewares/http.logger";
import cors from "cors";

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://binderlex.com"]
    : ["http://localhost:5173"];


export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  app.use(httpLogger);
  app.use(express.json());
  app.use(cookieParser());

  app.use(routes);

  app.use(errorMiddleware);

  return app;
};

