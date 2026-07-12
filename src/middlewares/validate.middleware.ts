import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

import type { ZodType } from "zod";

import { AppError } from "../errors/AppError";

export const validateRequest = (
  schema: ZodType,
): RequestHandler => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const validationErrors =
        result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        }));

      next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Request validation failed.",
          validationErrors,
        ),
      );

      return;
    }

    const validatedData = result.data as {
      body?: unknown;
      params?: Record<string, string>;
      query?: unknown;
    };

    /*
     * Replace the original values with the
     * trimmed and validated Zod output.
     */
    if (validatedData.body !== undefined) {
      req.body = validatedData.body;
    }

    if (validatedData.params !== undefined) {
      req.params = validatedData.params;
    }

    _res.locals.validatedQuery =
      validatedData.query;

    next();
  };
};