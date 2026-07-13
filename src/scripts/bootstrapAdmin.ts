import "dotenv/config";

import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

const bootstrapAdmin = async (): Promise<void> => {
    const name =
        process.env.ADMIN_NAME?.trim();

    const email =
        process.env.ADMIN_EMAIL
            ?.trim()
            .toLowerCase();

    const password =
        process.env.ADMIN_PASSWORD;

    if (!name) {
        throw new Error(
            "ADMIN_NAME is missing.",
        );
    }

    if (!email) {
        throw new Error(
            "ADMIN_EMAIL is missing.",
        );
    }

    if (!password) {
        throw new Error(
            "ADMIN_PASSWORD is missing.",
        );
    }

    if (password.length < 12) {
        throw new Error(
            "ADMIN_PASSWORD must contain at least 12 characters.",
        );
    }

    const passwordHash =
        await bcrypt.hash(password, 12);

    /*
     * Upsert makes this operation safe to run
     * each time the container starts.
     */
    const admin =
        await prisma.admin.upsert({
            where: {
                email,
            },

            update: {
                name,
                passwordHash,
                role: "super_admin",
                isActive: true,
            },

            create: {
                name,
                email,
                passwordHash,
                role: "super_admin",
                isActive: true,
            },

            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

    console.log(
        "Production administrator is ready:",
        {
            id: admin.id,
            email: admin.email,
            role: admin.role,
        },
    );
};

bootstrapAdmin()
    .catch((error) => {
        console.error(
            "Administrator bootstrap failed:",
            error,
        );

        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });