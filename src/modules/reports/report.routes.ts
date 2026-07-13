import { Router } from "express";
import { authenticateAdmin } from "../../middlewares/authenticateAdmin.middleware.js";
import { asyncHandler } from "../../utils/asynchandler.js";
import {
    createReportController,
    deleteReportController,
    getAllReportsController,
    getReportAnalyticsController,
    getReportByIdController,
    updateReportStatusController
} from "./report.controller.js";
import { reportSubmissionRateLimiter } from "../../middlewares/rateLimiters.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
    createReportValidationSchema,
    listReportsValidationSchema,
    reportIdValidationSchema,
    updateReportStatusValidationSchema
} from "./report.validation.js";
import { authorizeRoles } from "../../middlewares/authorizeRoles.middleware.js";


const reportRouter = Router();

/*
 * Protected analytics route.
 * Keep it above /:id.
 */
reportRouter.get(
    "/stats/summary",
    authenticateAdmin,
    asyncHandler(
        getReportAnalyticsController,
    ),
);

/*
 * Public citizen submission route.
 */
reportRouter.post(
    "/",
    reportSubmissionRateLimiter,
    validateRequest(
        createReportValidationSchema,
    ),
    asyncHandler(
        createReportController,
    ),
);

/*
 * Protected administrative listing.
 */
reportRouter.get(
    "/",
    authenticateAdmin,
    validateRequest(
        listReportsValidationSchema,
    ),
    asyncHandler(
        getAllReportsController,
    ),
);

/*
 * Protected report details.
 */
reportRouter.get(
    "/:id",
    authenticateAdmin,
    validateRequest(
        reportIdValidationSchema,
    ),
    asyncHandler(
        getReportByIdController,
    ),
);

/*
 * Protected status management.
 */
reportRouter.patch(
    "/:id/status",
    authenticateAdmin,
    validateRequest(
        updateReportStatusValidationSchema,
    ),
    asyncHandler(
        updateReportStatusController,
    ),
);

/*
 * Only a super admin may delete reports.
 */
reportRouter.delete(
    "/:id",
    authenticateAdmin,
    authorizeRoles(
        "super_admin",
    ),
    validateRequest(
        reportIdValidationSchema,
    ),
    asyncHandler(
        deleteReportController,
    ),
);

export { reportRouter };