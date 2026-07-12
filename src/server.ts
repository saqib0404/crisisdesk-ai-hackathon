import "dotenv/config";
import { prisma } from "./config/prisma";
import { app } from "./app";


const port = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    console.log(
      "Database connected successfully.",
    );

    const server = app.listen(port, () => {
      console.log(
        `CrisisDesk API running at http://localhost:${port}`,
      );
    });

    const shutdown = async (
      signal: string,
    ): Promise<void> => {
      console.log(
        `${signal} received. Closing server...`,
      );

      server.close(async () => {
        await prisma.$disconnect();

        console.log(
          "Database connection closed.",
        );

        process.exit(0);
      });
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    console.error(
      "Failed to start the application:",
      error,
    );

    await prisma.$disconnect();
    process.exit(1);
  }
};

void startServer();