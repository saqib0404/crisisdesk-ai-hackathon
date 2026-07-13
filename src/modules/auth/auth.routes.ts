import { Router } from "express";
import { loginRateLimiter } from "../../middlewares/rateLimiters.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { loginAdminValidationSchema } from "./auth.validation.js";
import { asyncHandler } from "../../utils/asynchandler.js";
import { getCurrentAdminController, loginAdminController } from "./auth.controller.js";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.middleware.js";



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