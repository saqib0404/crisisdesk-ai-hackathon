import type {
    CorsOptions,
} from "cors";
import { AppError } from "../errors/AppError.js";


const isProduction =
    process.env.NODE_ENV ===
    "production";

const allowedOrigins =
    (
        process.env.CORS_ORIGINS ??
        ""
    )
        .split(",")
        .map((origin) =>
            origin.trim(),
        )
        .filter(Boolean);

export const corsOptions:
    CorsOptions = {
    origin: (
        requestOrigin,
        callback,
    ) => {
        /*
         * Requests from Postman, curl and
         * server-to-server clients normally
         * have no Origin header.
         */
        if (!requestOrigin) {
            callback(null, true);
            return;
        }

        /*
         * During local development, allow
         * browser tools from any origin.
         */
        if (!isProduction) {
            callback(null, true);
            return;
        }

        if (
            allowedOrigins.includes(
                requestOrigin,
            )
        ) {
            callback(null, true);
            return;
        }

        callback(
            new AppError(
                403,
                "CORS_ORIGIN_DENIED",
                "This origin is not permitted to access the API.",
            ),
        );
    },

    methods: [
        "GET",
        "POST",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
    ],

    credentials: false,
};