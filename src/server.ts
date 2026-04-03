import { PORT } from "./config/env";
import app from "./app";

import { connectRedis, redisClient } from "./lib/redis";
import { RabbitMQClient } from "./rabbitmq/RabbitMQClient";
import { database } from "./lib/db";

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
          await database.$connect();

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
