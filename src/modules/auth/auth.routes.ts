import { Router } from "express";
import { loginRateLimiter } from "../../middlewares/rateLimiters.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { loginAdminValidationSchema } from "./auth.validation";
import { asyncHandler } from "../../utils/asynchandler";
import { getCurrentAdminController, loginAdminController } from "./auth.controller";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.middleware";



const authRouter = Router();

authRouter.post(
    "/login",
    loginRateLimiter,
    validateRequest(
        loginAdminValidationSchema,
    ),
    asyncHandler(
        loginAdminController,
    ),
);

authRouter.get(
    "/me",
    authenticateAdmin,
    asyncHandler(
        getCurrentAdminController,
    ),
);

export { authRouter };