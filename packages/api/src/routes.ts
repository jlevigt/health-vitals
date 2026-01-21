import { Router } from "express";
import { createUserRouter } from "@/features/auth/register/routes.js";
import { authenticateUserRouter } from "@/features/auth/login/routes.ts"; 
import { verifyEmailRouter } from "@/features/auth/verify-email/routes.ts";
import { refreshRouter } from "@/features/auth/refresh/routes.ts";
import { logoutRouter } from "@/features/auth/logout/routes.ts";
import { healthRouter } from "@/features/health/routes.ts";

import { filesRouter } from "@/features/files/routes.ts";
import { listReportObservationsRouter } from "@/features/reports/list-observations/routes.ts";
import { listReportsRouter } from "@/features/reports/list/routes.ts";
import { dashboardRouter } from "@/features/dashboard/get-trends/routes.ts";

const routes = Router();

routes.use("/health", healthRouter);

// === Auth Routes ===
routes.use("/auth/register", createUserRouter);
routes.use("/auth/login", authenticateUserRouter); 
routes.use("/auth/verify-email", verifyEmailRouter);
routes.use("/auth/refresh", refreshRouter);
routes.use("/auth/logout", logoutRouter);

// === File Upload Routes (async processing) ===
routes.use("/files", filesRouter);

// === Report Routes (read-only after processing) ===
routes.use("/reports", listReportsRouter);
routes.use("/reports", listReportObservationsRouter);

// === Dashboard Routes ===
routes.use("/dashboard", dashboardRouter);

export { routes };
