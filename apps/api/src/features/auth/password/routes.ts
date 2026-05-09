import { Router } from "express";
import { changePasswordRouter } from "./change-password/routes.ts";
import { requestRecoveryRouter } from "./request-recovery/routes.ts";
import { resetPasswordRouter } from "./reset-password/routes.ts";

const router = Router();

router.use("/recovery/request", requestRecoveryRouter);
router.use("/reset", resetPasswordRouter);
router.use("/change", changePasswordRouter);

export { router as passwordRouter };
