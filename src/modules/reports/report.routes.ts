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
import { validateRequest } from "../../middlewares/validate.middleware";
import { createReportValidationSchema, reportIdValidationSchema, updateReportStatusValidationSchema } from "./report.validation";



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
  validateRequest(
    createReportValidationSchema,
  ),
  asyncHandler(createReportController),
);

reportRouter.get(
  "/",
  asyncHandler(getAllReportsController),
);

reportRouter.get(
  "/:id",
  validateRequest(reportIdValidationSchema),
  asyncHandler(getReportByIdController),
);

reportRouter.patch(
  "/:id/status",
  validateRequest(
    updateReportStatusValidationSchema,
  ),
  asyncHandler(updateReportStatusController),
);

reportRouter.delete(
  "/:id",
  validateRequest(reportIdValidationSchema),
  asyncHandler(deleteReportController),
);

export { reportRouter };