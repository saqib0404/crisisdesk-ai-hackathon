import type {
  ErrorRequestHandler,
} from "express";
import { AppError } from "../errors/AppError";


export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,

      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    });

    return;
  }

  console.error("Unexpected application error:", error);

  res.status(500).json({
    success: false,

    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        "An unexpected server error occurred.",
      details: null,
    },
  });
};