import bcrypt from "bcryptjs";
import jwt, {
    type JwtPayload,
} from "jsonwebtoken";
import { AdminRoleValue, VerifiedAccessToken } from "./auth.types.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";


const JWT_SECRET =
    process.env.JWT_SECRET?.trim();

const JWT_EXPIRES_IN_SECONDS = Number(
    process.env.JWT_EXPIRES_IN_SECONDS ??
    7200,
);

const JWT_ISSUER =
    process.env.JWT_ISSUER?.trim() ||
    "crisisdesk-ai";

const JWT_AUDIENCE =
    process.env.JWT_AUDIENCE?.trim() ||
    "crisisdesk-admin";

const ALLOWED_ADMIN_ROLES: AdminRoleValue[] =
    ["admin", "super_admin"];

const getJwtSecret = (): string => {
    if (!JWT_SECRET) {
        throw new Error(
            "JWT_SECRET is missing from the environment variables.",
        );
    }

    return JWT_SECRET;
};

const getTokenExpiration = (): number => {
    if (
        !Number.isFinite(
            JWT_EXPIRES_IN_SECONDS,
        ) ||
        JWT_EXPIRES_IN_SECONDS <= 0
    ) {
        return 7200;
    }

    return JWT_EXPIRES_IN_SECONDS;
};

interface LoginAdminInput {
    email: string;
    password: string;
}

const generateAccessToken = (
    admin: {
        id: string;
        email: string;
        role: AdminRoleValue;
    },
): string => {
    return jwt.sign(
        {
            email: admin.email,
            role: admin.role,
        },
        getJwtSecret(),
        {
            algorithm: "HS256",
            subject: admin.id,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: getTokenExpiration(),
        },
    );
};

export const loginAdmin = async (
    input: LoginAdminInput,
) => {
    const email =
        input.email.trim().toLowerCase();

    const admin =
        await prisma.admin.findUnique({
            where: {
                email,
            },

            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
                role: true,
                isActive: true,
            },
        });

    /*
     * Use one generic response so that clients
     * cannot determine whether an email exists.
     */
    if (!admin || !admin.isActive) {
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
        );
    }

    const passwordMatches =
        await bcrypt.compare(
            input.password,
            admin.passwordHash,
        );

    if (!passwordMatches) {
        throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
        );
    }

    const role =
        admin.role as AdminRoleValue;

    const accessToken =
        generateAccessToken({
            id: admin.id,
            email: admin.email,
            role,
        });

    return {
        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role,
        },

        accessToken,
        tokenType: "Bearer",
        expiresIn:
            getTokenExpiration(),
    };
};

export const verifyAccessToken = (
    token: string,
): VerifiedAccessToken => {
    try {
        const decoded = jwt.verify(
            token,
            getJwtSecret(),
            {
                algorithms: ["HS256"],
                issuer: JWT_ISSUER,
                audience: JWT_AUDIENCE,
            },
        );

        if (
            typeof decoded === "string"
        ) {
            throw new Error(
                "Invalid token payload.",
            );
        }

        const payload =
            decoded as JwtPayload;

        if (
            typeof payload.sub !== "string" ||
            typeof payload.email !== "string" ||
            typeof payload.role !== "string"
        ) {
            throw new Error(
                "Required token claims are missing.",
            );
        }

        if (
            !ALLOWED_ADMIN_ROLES.includes(
                payload.role as AdminRoleValue,
            )
        ) {
            throw new Error(
                "Invalid administrator role.",
            );
        }

        return {
            adminId: payload.sub,
            email: payload.email,
            role:
                payload.role as AdminRoleValue,
        };
    } catch {
        throw new AppError(
            401,
            "INVALID_ACCESS_TOKEN",
            "The access token is invalid or has expired.",
        );
    }
};