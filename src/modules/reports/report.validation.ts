import * as z from "zod";
import { REPORT_CATEGORIES, REPORT_LANGUAGES, REPORT_STATUSES, REPORT_URGENCIES } from "./report.constants.js";


/*
 * Reusable report ID validator.
 *
 * Your Prisma model uses:
 * id String @id @default(cuid())
 */
const reportIdSchema = z.cuid({
    error: "A valid report ID is required.",
});

const reportDateSchema = z.iso.date({
    error: "Date must use YYYY-MM-DD format.",
});

export const listReportsValidationSchema = z.object({
    query: z
        .object({
            category: z
                .enum(REPORT_CATEGORIES, {
                    error: "Invalid report category.",
                })
                .optional(),

            urgency: z
                .enum(REPORT_URGENCIES, {
                    error: "Invalid report urgency.",
                })
                .optional(),

            status: z
                .enum(REPORT_STATUSES, {
                    error: "Invalid report status.",
                })
                .optional(),

            language: z
                .enum(REPORT_LANGUAGES, {
                    error: "Invalid report language.",
                })
                .optional(),

            search: z
                .string({
                    error: "Search must be a string.",
                })
                .trim()
                .min(1, {
                    message: "Search cannot be empty.",
                })
                .max(200, {
                    message:
                        "Search cannot exceed 200 characters.",
                })
                .optional(),

            startDate: reportDateSchema.optional(),

            endDate: reportDateSchema.optional(),

            page: z.coerce
                .number()
                .int({
                    message: "Page must be a whole number.",
                })
                .min(1, {
                    message: "Page must be at least 1.",
                })
                .default(1),

            limit: z.coerce
                .number()
                .int({
                    message: "Limit must be a whole number.",
                })
                .min(1, {
                    message: "Limit must be at least 1.",
                })
                .max(100, {
                    message:
                        "Limit cannot exceed 100.",
                })
                .default(20),

            sortBy: z
                .enum([
                    "createdAt",
                    "updatedAt",
                    "confidence",
                ])
                .default("createdAt"),

            sortOrder: z
                .enum(["asc", "desc"])
                .default("desc"),
        })
        .strict()
        .superRefine((query, context) => {
            if (
                query.startDate &&
                query.endDate &&
                new Date(query.startDate) >
                new Date(query.endDate)
            ) {
                context.addIssue({
                    code: "custom",
                    path: ["endDate"],
                    message:
                        "End date cannot be earlier than start date.",
                });
            }
        }),
});

/*
 * POST /api/reports
 */
export const createReportValidationSchema =
    z.object({
        body: z
            .object({
                name: z
                    .string({
                        error: "Name must be a string.",
                    })
                    .trim()
                    .min(2, {
                        message:
                            "Name must contain at least 2 characters.",
                    })
                    .max(120, {
                        message:
                            "Name cannot exceed 120 characters.",
                    })
                    .optional(),

                contact: z
                    .string({
                        error: "Contact must be a string.",
                    })
                    .trim()
                    .max(150, {
                        message:
                            "Contact cannot exceed 150 characters.",
                    })
                    .optional(),

                location: z
                    .string({
                        error:
                            "Location is required and must be a string.",
                    })
                    .trim()
                    .min(1, {
                        message: "Location is required.",
                    })
                    .min(3, {
                        message:
                            "Location must contain at least 3 characters.",
                    })
                    .max(500, {
                        message:
                            "Location cannot exceed 500 characters.",
                    }),

                description: z
                    .string({
                        error:
                            "Description is required and must be a string.",
                    })
                    .trim()
                    .min(1, {
                        message: "Description is required.",
                    })
                    .min(10, {
                        message:
                            "Description must contain at least 10 characters.",
                    })
                    .max(5000, {
                        message:
                            "Description cannot exceed 5000 characters.",
                    }),

                language: z
                    .enum(REPORT_LANGUAGES, {
                        error:
                            "Language must be bn, en, or unknown.",
                    })
                    .default("unknown"),
            })
            .strict()
    });

/*
 * GET /api/reports/:id
 * DELETE /api/reports/:id
 */
export const reportIdValidationSchema =
    z.object({
        params: z.object({
            id: reportIdSchema,
        }),
    });

/*
 * PATCH /api/reports/:id/status
 */
export const updateReportStatusValidationSchema =
    z.object({
        params: z.object({
            id: reportIdSchema,
        }),

        body: z
            .object({
                status: z.enum(REPORT_STATUSES, {
                    error:
                        "Status must be pending, in_review, assigned, resolved, or rejected.",
                }),
            })
            .strict()
    });

export type CreateReportRequestBody =
    z.infer<
        typeof createReportValidationSchema
    >["body"];

export type UpdateReportStatusRequestBody =
    z.infer<
        typeof updateReportStatusValidationSchema
    >["body"];

export type ListReportsQuery =
    z.infer<
        typeof listReportsValidationSchema
    >["query"];