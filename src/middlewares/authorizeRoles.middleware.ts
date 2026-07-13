import type {
    RequestHandler,
} from "express";
import { AdminRoleValue, AuthenticatedAdmin } from "../modules/auth/auth.types.js";
import { AppError } from "../errors/AppError.js";


export const authorizeRoles = (
    ...allowedRoles: AdminRoleValue[]
): RequestHandler => {
    return (_req, res, next) => {
        const admin =
            res.locals.admin as
            | AuthenticatedAdmin
            | undefined;

        if (!admin) {
            next(
                new AppError(
                    401,
                    "AUTHENTICATION_REQUIRED",
                    "Administrator authentication is required.",
                ),
            );

            return;
        }

        if (
            !allowedRoles.includes(
                admin.role,
            )
        ) {
            next(
                new AppError(
                    403,
                    "INSUFFICIENT_PERMISSION",
                    "You do not have permission to perform this action.",
                ),
            );

            return;
        }

        next();
    };
};