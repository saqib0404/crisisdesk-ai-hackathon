import { Router } from "express";
import { asyncHandler } from "../../utils/asynchandler";
import {
    createReportController,
    deleteReportController,
    getAllReportsController,
    getReportAnalyticsController,
    getReportByIdController,
    updateReportStatusController
} from "./report.controller";



const reportRouter = Router();

/**
 * This route must appear before /:id.
 *
 * Otherwise Express may treat "stats"
 * as a report ID.
 */
reportRouter.get(
    "/stats/summary",
    asyncHandler(getReportAnalyticsController),
);

reportRouter.post(
    "/",
    asyncHandler(createReportController),
);

reportRouter.get(
    "/",
    asyncHandler(getAllReportsController),
);

reportRouter.get(
    "/:id",
    asyncHandler(getReportByIdController),
);

reportRouter.patch(
    "/:id/status",
    asyncHandler(updateReportStatusController),
);

reportRouter.delete(
    "/:id",
    asyncHandler(deleteReportController),
);

export { reportRouter };