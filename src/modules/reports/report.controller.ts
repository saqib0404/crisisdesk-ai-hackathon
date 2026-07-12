import type {
  Request,
  Response,
} from "express";
import { CreateReportRequestBody, UpdateReportStatusRequestBody } from "./report.validation";
import { createReport, deleteReport, getAllReports, getReportAnalytics, getReportById, updateReportStatus } from "./report.service";
import { CreateReportInput } from "./report.types";



/*
 * POST /api/reports
 */
export const createReportController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const input =
    req.body as CreateReportRequestBody;

  const report = await createReport(input as CreateReportInput);

  res.status(201).json({
    success: true,
    message:
      "Report submitted successfully.",
    data: report,
  });
};

/*
 * GET /api/reports
 */
export const getAllReportsController = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const reports = await getAllReports();

  res.status(200).json({
    success: true,
    message:
      "Reports retrieved successfully.",
    data: reports,

    meta: {
      count: reports.length,
    },
  });
};

/*
 * GET /api/reports/:id
 */
export const getReportByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  const report = await getReportById(id as string);

  res.status(200).json({
    success: true,
    message:
      "Report retrieved successfully.",
    data: report,
  });
};

/*
 * PATCH /api/reports/:id/status
 */
export const updateReportStatusController =
  async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;

    const { status } =
      req.body as UpdateReportStatusRequestBody;

    const updatedReport =
      await updateReportStatus(
        id as string,
        status,
      );

    res.status(200).json({
      success: true,
      message:
        "Report status updated successfully.",
      data: updatedReport,
    });
  };

/*
 * DELETE /api/reports/:id
 */
export const deleteReportController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  await deleteReport(id as string);

  res.status(200).json({
    success: true,
    message:
      "Report deleted successfully.",
    data: null,
  });
};

/*
 * GET /api/reports/stats/summary
 */
export const getReportAnalyticsController =
  async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    const analytics =
      await getReportAnalytics();

    res.status(200).json({
      success: true,
      message:
        "Report analytics retrieved successfully.",
      data: analytics,
    });
  };