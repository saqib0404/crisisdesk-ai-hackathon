import { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import { REPORT_LANGUAGES, REPORT_STATUSES } from "./report.constants";
import { createReport, deleteReport, getAllReports, getReportAnalytics, getReportById, updateReportStatus } from "./report.service";
import { CreateReportInput, ReportLanguageValue, ReportStatusValue } from "./report.types";


/**
 * POST /api/reports
 */
export const createReportController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const {
        name,
        contact,
        location,
        description,
        language = "unknown",
    } = req.body ?? {};

    if (
        typeof location !== "string" ||
        location.trim().length === 0
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Location is required.",
            {
                field: "location",
            },
        );
    }

    if (
        typeof description !== "string" ||
        description.trim().length === 0
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Description is required.",
            {
                field: "description",
            },
        );
    }

    if (
        typeof language !== "string" ||
        !REPORT_LANGUAGES.some(
            (allowedLanguage) =>
                allowedLanguage === language,
        )
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Language must be bn, en, or unknown.",
            {
                field: "language",
                allowedValues: REPORT_LANGUAGES,
            },
        );
    }

    if (
        name !== undefined &&
        typeof name !== "string"
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Name must be a string.",
            {
                field: "name",
            },
        );
    }

    if (
        contact !== undefined &&
        typeof contact !== "string"
    ) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Contact must be a string.",
            {
                field: "contact",
            },
        );
    }

    const input: CreateReportInput = {
        name,
        contact,
        location,
        description,
        language: language as ReportLanguageValue,
    };

    const report = await createReport(input);

    res.status(201).json({
        success: true,
        message: "Report submitted successfully.",
        data: report,
    });
};

/**
 * GET /api/reports
 */
export const getAllReportsController = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    const reports = await getAllReports();

    res.status(200).json({
        success: true,
        message: "Reports retrieved successfully.",
        data: reports,
        meta: {
            count: reports.length,
        },
    });
};

/**
 * GET /api/reports/:id
 */
export const getReportByIdController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(
            400,
            "INVALID_REPORT_ID",
            "Report ID is required.",
        );
    }

    const report = await getReportById(id as any);

    res.status(200).json({
        success: true,
        message: "Report retrieved successfully.",
        data: report,
    });
};

/**
 * PATCH /api/reports/:id/status
 */
export const updateReportStatusController =
    async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const { id } = req.params;
        const { status } = req.body ?? {};

        if (!id) {
            throw new AppError(
                400,
                "INVALID_REPORT_ID",
                "Report ID is required.",
            );
        }

        if (
            typeof status !== "string" ||
            !REPORT_STATUSES.some(
                (allowedStatus) =>
                    allowedStatus === status,
            )
        ) {
            throw new AppError(
                400,
                "INVALID_REPORT_STATUS",
                "Invalid report status.",
                {
                    field: "status",
                    allowedValues: REPORT_STATUSES,
                },
            );
        }

        const updatedReport =
            await updateReportStatus(
                id as any,
                status as ReportStatusValue,
            );

        res.status(200).json({
            success: true,
            message: "Report status updated successfully.",
            data: updatedReport,
        });
    };

/**
 * DELETE /api/reports/:id
 */
export const deleteReportController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(
            400,
            "INVALID_REPORT_ID",
            "Report ID is required.",
        );
    }

    await deleteReport(id as any);

    res.status(200).json({
        success: true,
        message: "Report deleted successfully.",
        data: null,
    });
};

/**
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