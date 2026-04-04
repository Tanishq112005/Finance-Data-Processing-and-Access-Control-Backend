import express from "express";
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { FinanceConsumer } from "../rabbitmq/consumers/finance-consumer";
import { connectRedis } from "../lib/redis";
import { database } from "../lib/db";
import { FINACE_WORKER_PORT } from "../config/env";

const startFinanceWorker = async () => {
  try {
    console.log("💰 Starting Finance Worker Service...");

    await database.$connect();
    await connectRedis();
    await rabbitMQClient.connect();

    const financeConsumer = new FinanceConsumer(rabbitMQClient);
    await financeConsumer.start();

    console.log("✅ Finance Worker is now listening for messages...");

    const app = express();
    const port = FINACE_WORKER_PORT || 3002;

    app.get("/health", (req: any, res: any) => {
      res.send("Finance Worker is Running 🚀");
    });

    app.listen(port, () => {
      console.log(`❤️ Health check server listening on port ${port}`);
    });

    process.on("SIGTERM", async () => {
      console.log("🛑 SIGTERM received. Closing...");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Finance Worker failed to start:", error);
    process.exit(1);
  }
};

startFinanceWorker();
