import * as z from "zod";

export const loginAdminValidationSchema =
    z.object({
        body: z
            .object({
                email: z
                    .string({
                        error:
                            "Email is required and must be a string.",
                    })
                    .trim()
                    .email({
                        message:
                            "A valid email address is required.",
                    })
                    .transform((value) =>
                        value.toLowerCase(),
                    ),

                password: z
                    .string({
                        error:
                            "Password is required and must be a string.",
                    })
                    .min(8, {
                        message:
                            "Password must contain at least 8 characters.",
                    })
                    .max(72, {
                        message:
                            "Password cannot exceed 72 characters.",
                    }),
            })
            .strict()
    });

export type LoginAdminRequestBody =
    z.infer<
        typeof loginAdminValidationSchema
    >["body"];