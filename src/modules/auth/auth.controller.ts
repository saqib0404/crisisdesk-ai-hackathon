import type {
    Request,
    Response,
} from "express";
import { LoginAdminRequestBody } from "./auth.validation";
import { loginAdmin } from "./auth.service";
import { AuthenticatedAdmin } from "./auth.types";


export const loginAdminController =
    async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const input =
            req.body as
            LoginAdminRequestBody;

        const result =
            await loginAdmin(input);

        res.status(200).json({
            success: true,
            message:
                "Administrator login successful.",
            data: result,
        });
    };

export const getCurrentAdminController =
    async (
        _req: Request,
        res: Response,
    ): Promise<void> => {
        const admin =
            res.locals
                .admin as AuthenticatedAdmin;

        res.status(200).json({
            success: true,
            message:
                "Authenticated administrator retrieved successfully.",
            data: admin,
        });
    };