import { type Request, type Response, Router } from "express";
import swaggerUi from "swagger-ui-express";
import { buildOpenApiDocument } from "./openapi.ts";

const openApiDocument = buildOpenApiDocument();

const docsRouter = Router();

docsRouter.get("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json(openApiDocument);
});

docsRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    customSiteTitle: "Health Vitals API Docs",
    swaggerOptions: {
      url: "/openapi.json",
      persistAuthorization: true,
    },
  }),
);

export { docsRouter };
