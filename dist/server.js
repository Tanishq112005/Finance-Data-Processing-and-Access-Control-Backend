"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const redis_1 = require("./lib/redis");
const RabbitMQClient_1 = require("./rabbitmq/RabbitMQClient");
const db_1 = require("./lib/db");
const ApiError_1 = __importDefault(require("./utils/ApiError"));
const ApiResponse_1 = __importDefault(require("./utils/ApiResponse"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/health", (req, res) => {
    res
        .status(200)
        .json(new ApiResponse_1.default("Server is healthy", { uptime: process.uptime() }));
});
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/finance", finance_routes_1.default);
app.use("/api/v1/users", user_routes_1.default);
app.use((err, req, res, next) => {
    if (err instanceof ApiError_1.default) {
        return res.status(err.errors?.status || 500).json(err);
    }
    console.error("[Unhandled Error]", err);
    return res
        .status(500)
        .json(new ApiError_1.default("Internal Server Error", { details: err.message }));
});
const startServer = async () => {
    try {
        console.log("Starting server...");
        await db_1.database.$connect();
        await (0, redis_1.connectRedis)();
        await RabbitMQClient_1.RabbitMQClient.getInstance().connect();
        const server = app.listen(env_1.PORT, () => {
            console.log(`[Server] Running at http://localhost:${env_1.PORT}`);
        });
        const gracefulShutdown = async (signal) => {
            console.log(`\n[${signal}] Shutting down gracefully...`);
            server.close(async () => {
                console.log("[Server] Closed.");
                try {
                    await db_1.database.$disconnect();
                    if (redis_1.redisClient.isOpen) {
                        await redis_1.redisClient.quit();
                        console.log("[Redis] Disconnected.");
                    }
                    await RabbitMQClient_1.RabbitMQClient.getInstance().disconnect();
                    console.log("Cleanup complete. Exiting.");
                    process.exit(0);
                }
                catch (err) {
                    console.error("Error during graceful shutdown:", err);
                    process.exit(1);
                }
            });
        };
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
