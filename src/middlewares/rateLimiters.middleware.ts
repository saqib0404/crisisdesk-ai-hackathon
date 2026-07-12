import {
    rateLimit,
} from "express-rate-limit";

/*
 * General protection for API endpoints.
 */
export const apiRateLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit: 500,

        standardHeaders:
            "draft-8",

        legacyHeaders: false,

        handler: (_req, res) => {
            res.status(429).json({
                success: false,

                error: {
                    code:
                        "API_RATE_LIMIT_EXCEEDED",

                    message:
                        "Too many API requests. Please try again later.",

                    details: null,
                },
            });
        },
    });

/*
 * Strict protection against repeated
 * administrator login attempts.
 */
export const loginRateLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit: 5,

        standardHeaders:
            "draft-8",

        legacyHeaders: false,

        /*
         * Successful login attempts do not
         * consume the failed-login quota.
         */
        skipSuccessfulRequests: true,

        handler: (_req, res) => {
            res.status(429).json({
                success: false,

                error: {
                    code:
                        "LOGIN_RATE_LIMIT_EXCEEDED",

                    message:
                        "Too many failed login attempts. Please try again later.",

                    details: null,
                },
            });
        },
    });

/*
 * Public report-submission protection.
 */
export const reportSubmissionRateLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        limit: 20,

        standardHeaders:
            "draft-8",

        legacyHeaders: false,

        handler: (_req, res) => {
            res.status(429).json({
                success: false,

                error: {
                    code:
                        "REPORT_RATE_LIMIT_EXCEEDED",

                    message:
                        "Too many reports have been submitted from this address. Please try again later.",

                    details: null,
                },
            });
        },
    });