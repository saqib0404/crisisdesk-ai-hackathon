import * as z from "zod";
import { REPORT_LANGUAGES, REPORT_STATUSES } from "./report.constants";


/*
 * Reusable report ID validator.
 *
 * Your Prisma model uses:
 * id String @id @default(cuid())
 */
const reportIdSchema = z.cuid({
  error: "A valid report ID is required.",
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