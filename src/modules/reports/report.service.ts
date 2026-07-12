import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/AppError";
import { Prisma } from "../../generated/prisma/client";
import { classifyEmergencyReport } from "../../services/ai.service";
import { REPORT_CATEGORIES, REPORT_URGENCIES } from "./report.constants";
import { CreateReportInput, ReportStatusValue } from "./report.types";
import { ListReportsQuery } from "./report.validation";


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
    /**
     * Call Gemini before storing the report.
     *
     * The AI service always returns either:
     * - a successful classification; or
     * - a safe fallback classification.
     */
    const aiResult =
        await classifyEmergencyReport({
            location: input.location.trim(),

            description:
                input.description.trim(),

            language: input.language,
        });

    const manualReviewThreshold = Number(
        process.env
            .AI_MANUAL_REVIEW_THRESHOLD || 0.6,
    );

    const requiresManualReview =
        aiResult.aiStatus !== "success" ||
        aiResult.confidence <
        manualReviewThreshold;

    const report =
        await prisma.report.create({
            data: {
                name:
                    input.name?.trim() || null,

                contact:
                    input.contact?.trim() || null,

                location:
                    input.location.trim(),

                normalizedLocation:
                    normalizeText(input.location),

                description:
                    input.description.trim(),

                normalizedDescription:
                    normalizeText(
                        input.description,
                    ),

                language: input.language,

                /**
                 * Gemini classification
                 */
                category:
                    aiResult.category,

                urgency:
                    aiResult.urgency,

                summary:
                    aiResult.summary,

                suggestedAction:
                    aiResult.suggestedAction,

                confidence:
                    aiResult.confidence,

                /**
                 * Duplicate detection will be
                 * implemented in the next step.
                 */
                possibleDuplicate: false,
                duplicateScore: null,
                matchedReportId: null,

                status: "pending",

                /**
                 * AI processing information
                 */
                aiStatus:
                    aiResult.aiStatus,

                aiProvider:
                    aiResult.aiProvider,

                aiModel:
                    aiResult.aiModel,

                aiMetadata:
                    aiResult.metadata,

                requiresManualReview,

                statusHistory: {
                    create: {
                        previousStatus: null,
                        newStatus: "pending",

                        note:
                            aiResult.aiStatus ===
                                "success"
                                ? "Report submitted and automatically classified."
                                : "Report submitted using AI fallback and requires manual review.",
                    },
                },
            },
        });

    return report;
};

/**
 * GET /api/reports
 */

const getStartOfUtcDay = (
    dateValue: string,
): Date => {
    return new Date(
        `${dateValue}T00:00:00.000Z`,
    );
};

const getEndOfUtcDay = (
    dateValue: string,
): Date => {
    return new Date(
        `${dateValue}T23:59:59.999Z`,
    );
};

export const getAllReports = async (
    query: ListReportsQuery,
) => {
    const {
        category,
        urgency,
        status,
        language,
        search,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder,
    } = query;

    const where: Prisma.ReportWhereInput = {};

    /*
     * Exact enum filters
     */
    if (category) {
        where.category = category;
    }

    if (urgency) {
        where.urgency = urgency;
    }

    if (status) {
        where.status = status;
    }

    if (language) {
        where.language = language;
    }

    /*
     * Free-text search
     */
    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },

            {
                contact: {
                    contains: search,
                    mode: "insensitive",
                },
            },

            {
                location: {
                    contains: search,
                    mode: "insensitive",
                },
            },

            {
                normalizedLocation: {
                    contains: search,
                    mode: "insensitive",
                },
            },

            {
                description: {
                    contains: search,
                    mode: "insensitive",
                },
            },

            {
                normalizedDescription: {
                    contains: search,
                    mode: "insensitive",
                },
            },

            {
                summary: {
                    contains: search,
                    mode: "insensitive",
                },
            },

            {
                suggestedAction: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        ];
    }

    /*
     * Date-range filter
     */
    const createdAtFilter: Prisma.DateTimeFilter =
        {};

    if (startDate) {
        createdAtFilter.gte =
            getStartOfUtcDay(startDate);
    }

    if (endDate) {
        createdAtFilter.lte =
            getEndOfUtcDay(endDate);
    }

    if (startDate || endDate) {
        where.createdAt = createdAtFilter;
    }

    /*
     * Offset pagination
     */
    const skip = (page - 1) * limit;

    /*
     * Dynamic sorting.
     *
     * The ID becomes a secondary sort field so
     * results remain stable when two reports have
     * the same date or confidence value.
     */
    const primaryOrder = {
        [sortBy]: sortOrder,
    } as Prisma.ReportOrderByWithRelationInput;

    const orderBy:
        Prisma.ReportOrderByWithRelationInput[] = [
            primaryOrder,
            {
                id: "asc",
            },
        ];

    /*
     * Retrieve the selected page and total count
     * together.
     */
    const [reports, totalReports] =
        await prisma.$transaction([
            prisma.report.findMany({
                where,

                skip,

                take: limit,

                orderBy,

                include: {
                    matchedReport: {
                        select: {
                            id: true,
                            location: true,
                            category: true,
                            urgency: true,
                            status: true,
                        },
                    },
                },
            }),

            prisma.report.count({
                where,
            }),
        ]);

    const totalPages =
        totalReports === 0
            ? 0
            : Math.ceil(totalReports / limit);

    return {
        reports,

        pagination: {
            page,
            limit,
            totalReports,
            totalPages,
            returnedReports: reports.length,
            hasNextPage:
                totalPages > 0 && page < totalPages,
            hasPreviousPage: page > 1,
        },

        appliedFilters: {
            category: category ?? null,
            urgency: urgency ?? null,
            status: status ?? null,
            language: language ?? null,
            search: search ?? null,
            startDate: startDate ?? null,
            endDate: endDate ?? null,
            sortBy,
            sortOrder,
        },
    };
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