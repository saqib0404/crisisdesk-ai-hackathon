import type {
    RequestHandler,
} from "express";
import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "../modules/auth/auth.service.js";
import { prisma } from "../config/prisma.js";
import { AdminRoleValue, AuthenticatedAdmin } from "../modules/auth/auth.types.js";


export const authenticateAdmin:
    RequestHandler = (
        req,
        res,
        next,
    ) => {
        void (async () => {
            const authorizationHeader =
                req.headers.authorization;

            if (
                !authorizationHeader ||
                !authorizationHeader.startsWith(
                    "Bearer ",
                )
            ) {
                throw new AppError(
                    401,
                    "AUTHENTICATION_REQUIRED",
                    "A Bearer access token is required.",
                );
            }

            const token =
                authorizationHeader
                    .slice("Bearer ".length)
                    .trim();

            if (!token) {
                throw new AppError(
                    401,
                    "AUTHENTICATION_REQUIRED",
                    "A Bearer access token is required.",
                );
            }

            const tokenPayload =
                verifyAccessToken(token);

            /*
             * Check the database on each protected
             * request so a disabled administrator
             * immediately loses access.
             */
            const admin =
                await prisma.admin.findUnique({
                    where: {
                        id: tokenPayload.adminId,
                    },

                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                    },
                });

            if (!admin || !admin.isActive) {
                throw new AppError(
                    401,
                    "ADMIN_ACCOUNT_UNAVAILABLE",
                    "The administrator account is unavailable.",
                );
            }

            const authenticatedAdmin:
                AuthenticatedAdmin = {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role:
                    admin.role as AdminRoleValue,
            };

            res.locals.admin =
                authenticatedAdmin;

            next();
        })().catch(next);
    };