import express from "express";
import { reportRouter } from "./modules/reports/report.routes";
import { notFoundHandler } from "./middlewares/notFoundHandler.middleware";
import { errorHandler } from "./middlewares/error.middleware";



const app = express();

/**
 * Parse JSON request bodies.
 */
app.use(
  express.json({
    limit: "100kb",
  }),
);

/**
 * Basic health-check route.
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CrisisDesk AI API is running.",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Report routes.
 */
app.use("/api/reports", reportRouter);

/**
 * This must appear after all valid routes.
 */
app.use(notFoundHandler);

/**
 * Error middleware must be last.
 */
app.use(errorHandler);

export { app };