"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const finance_consumer_1 = require("../rabbitmq/consumers/finance-consumer");
const redis_1 = require("../lib/redis");
const db_1 = require("../lib/db");
const startFinanceWorker = async () => {
    try {
        console.log("💰 Starting Finance Worker Service...");
        await db_1.database.$connect();
        await (0, redis_1.connectRedis)();
        await rabbitmq_connection_1.rabbitMQClient.connect();
        const financeConsumer = new finance_consumer_1.FinanceConsumer(rabbitmq_connection_1.rabbitMQClient);
        await financeConsumer.start();
        console.log("✅ Finance Worker is now listening for messages...");
        const app = (0, express_1.default)();
        const port = 3002;
        app.get("/health", (req, res) => {
            res.send("Finance Worker is Running 🚀");
        });
        app.listen(port, () => {
            console.log(`❤️ Health check server listening on port ${port}`);
        });
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing...");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("❌ Finance Worker failed to start:", error);
        process.exit(1);
    }
};
startFinanceWorker();
