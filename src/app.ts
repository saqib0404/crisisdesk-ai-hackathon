import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOptions } from "./config/cors";
import { apiRateLimiter } from "./middlewares/rateLimiters.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { reportRouter } from "./modules/reports/report.routes";
import { notFoundHandler } from "./middlewares/notFoundHandler.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

/*
 * Required when deployed behind one trusted
 * proxy such as Render or Railway.
 */
if (
  process.env.NODE_ENV ===
  "production"
) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

/*
 * Security-related HTTP response headers.
 */
app.use(helmet());

/*
 * Browser-origin rules.
 */
app.use(cors(corsOptions));

/*
 * Parse JSON request bodies.
 */
app.use(
  express.json({
    limit: "100kb",
  }),
);

/*
 * Health check remains outside the
 * general API rate limiter.
 */
app.get(
  "/api/health",
  (_req, res) => {
    res.status(200).json({
      success: true,
      message:
        "CrisisDesk AI API is running.",
      timestamp:
        new Date().toISOString(),
    });
  },
);

/*
 * General API rate limiting.
 */
app.use(
  "/api",
  apiRateLimiter,
);

/*
 * Application routes.
 */
app.use(
  "/api/auth",
  authRouter,
);

app.use(
  "/api/reports",
  reportRouter,
);

/*
 * Unmatched routes.
 */
app.use(notFoundHandler);

/*
 * Global error handler must remain last.
 */
app.use(errorHandler);

export { app };