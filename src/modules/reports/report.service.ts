import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/AppError";
import { REPORT_CATEGORIES, REPORT_URGENCIES } from "./report.constants";
import { CreateReportInput, ReportStatusValue } from "./report.types";


/**
 * Temporary normalisation.
 * Later, this will be improved for duplicate detection.
 */
const normalizeText = (value: string): string => {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

/**
 * POST /api/reports
 */
export const createReport = async (
    input: CreateReportInput,
) => {
    const report = await prisma.report.create({
        data: {
            name: input.name?.trim() || null,
            contact: input.contact?.trim() || null,

            location: input.location.trim(),
            normalizedLocation: normalizeText(input.location),

            description: input.description.trim(),
            normalizedDescription: normalizeText(
                input.description,
            ),

            language: input.language,

            // Temporary values until AI is integrated
            category: "other",
            urgency: "medium",
            summary: "Temporary summary",
            suggestedAction: "Manual review required.",
            confidence: 0,

            possibleDuplicate: false,
            duplicateScore: null,
            matchedReportId: null,

            status: "pending",
            aiStatus: "pending",
            requiresManualReview: true,

            statusHistory: {
                create: {
                    previousStatus: null,
                    newStatus: "pending",
                    note: "Report submitted.",
                },
            },
        },
    });

    return report;
};

/**
 * GET /api/reports
 */
export const getAllReports = async () => {
    const reports = await prisma.report.findMany({
        orderBy: {
            createdAt: "desc",
        },

        include: {
            matchedReport: {
                select: {
                    id: true,
                    location: true,
                    category: true,
                    urgency: true,
                },
            },
        },
    });

    return reports;
};

/**
 * GET /api/reports/:id
 */
export const getReportById = async (
    reportId: string,
) => {
    const report = await prisma.report.findUnique({
        where: {
            id: reportId,
        },

        include: {
            matchedReport: {
                select: {
                    id: true,
                    location: true,
                    description: true,
                    category: true,
                    urgency: true,
                    status: true,
                },
            },

            duplicateReports: {
                select: {
                    id: true,
                    location: true,
                    description: true,
                    category: true,
                    urgency: true,
                    status: true,
                    duplicateScore: true,
                },
            },

            statusHistory: {
                orderBy: {
                    changedAt: "desc",
                },
            },
        },
    });

    if (!report) {
        throw new AppError(
            404,
            "REPORT_NOT_FOUND",
            "Report not found.",
        );
    }

    return report;
};

/**
 * PATCH /api/reports/:id/status
 */
export const updateReportStatus = async (
    reportId: string,
    newStatus: ReportStatusValue,
) => {
    const updatedReport = await prisma.$transaction(
        async (transaction) => {
            const existingReport =
                await transaction.report.findUnique({
                    where: {
                        id: reportId,
                    },

                    select: {
                        id: true,
                        status: true,
                    },
                });

            if (!existingReport) {
                throw new AppError(
                    404,
                    "REPORT_NOT_FOUND",
                    "Report not found.",
                );
            }

            const report = await transaction.report.update({
                where: {
                    id: reportId,
                },

                data: {
                    status: newStatus,
                },
            });

            await transaction.reportStatusHistory.create({
                data: {
                    reportId,
                    previousStatus: existingReport.status,
                    newStatus,
                    note: `Status changed from ${existingReport.status} to ${newStatus}.`,
                },
            });

            return report;
        },
    );

    return updatedReport;
};

/**
 * DELETE /api/reports/:id
 */
export const deleteReport = async (
    reportId: string,
) => {
    const existingReport = await prisma.report.findUnique({
        where: {
            id: reportId,
        },

        select: {
            id: true,
        },
    });

    if (!existingReport) {
        throw new AppError(
            404,
            "REPORT_NOT_FOUND",
            "Report not found.",
        );
    }

    await prisma.report.delete({
        where: {
            id: reportId,
        },
    });
};

/**
 * GET /api/reports/stats/summary
 */
export const getReportAnalytics = async () => {
    const [
        totalReports,
        criticalReports,
        pendingReports,
        resolvedReports,
        categoryGroups,
        urgencyGroups,
    ] = await Promise.all([
        prisma.report.count(),

        prisma.report.count({
            where: {
                urgency: "critical",
            },
        }),

        prisma.report.count({
            where: {
                status: "pending",
            },
        }),

        prisma.report.count({
            where: {
                status: "resolved",
            },
        }),

        prisma.report.groupBy({
            by: ["category"],

            _count: {
                _all: true,
            },
        }),

        prisma.report.groupBy({
            by: ["urgency"],

            _count: {
                _all: true,
            },
        }),
    ]);

    const categoryBreakdown: Record<string, number> =
        Object.fromEntries(
            REPORT_CATEGORIES.map((category) => [
                category,
                0,
            ]),
        );

    const urgencyBreakdown: Record<string, number> =
        Object.fromEntries(
            REPORT_URGENCIES.map((urgency) => [
                urgency,
                0,
            ]),
        );

    for (const group of categoryGroups) {
        categoryBreakdown[group.category] =
            group._count._all;
    }

    for (const group of urgencyGroups) {
        urgencyBreakdown[group.urgency] =
            group._count._all;
    }

    return {
        totalReports,
        criticalReports,
        pendingReports,
        resolvedReports,
        categoryBreakdown,
        urgencyBreakdown,
    };
};