import express, { Request, Response, NextFunction } from "express";
import { PORT } from "./config/env";
import { connectRedis, redisClient } from "./lib/redis";
import { RabbitMQClient } from "./rabbitmq/RabbitMQClient";
import { database } from "./lib/db";
import ApiError from "./utils/ApiError";
import ApiResponse from "./utils/ApiResponse";

import authRoutes from "./routes/auth.routes";
import financeRoutes from "./routes/finance.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse("Server is healthy", { uptime: process.uptime() }));
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/finance", financeRoutes);
app.use("/api/v1/users", userRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.errors?.status || 500).json(err);
  }

  console.error("[Unhandled Error]", err);
  return res
    .status(500)
    .json(new ApiError("Internal Server Error", { details: err.message }));
});

const startServer = async () => {
  try {
    console.log("Starting server...");

    await database.$connect();

    await connectRedis();

    await RabbitMQClient.getInstance().connect();

    const server = app.listen(PORT, () => {
      console.log(`[Server] Running at http://localhost:${PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[${signal}] Shutting down gracefully...`);

      server.close(async () => {
        console.log("[Server] Closed.");

        try {
          await database.$disconnect();

          if (redisClient.isOpen) {
            await redisClient.quit();
            console.log("[Redis] Disconnected.");
          }

          await RabbitMQClient.getInstance().disconnect();

          console.log("Cleanup complete. Exiting.");
          process.exit(0);
        } catch (err) {
          console.error("Error during graceful shutdown:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
