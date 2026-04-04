"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const env_1 = require("../config/env");
exports.redisClient = (0, redis_1.createClient)({
    url: env_1.REDIS_URL,
});
exports.redisClient.on("error", (err) => console.error("[Redis] Client error:", err));
const connectRedis = async () => {
    if (!exports.redisClient.isOpen) {
        await exports.redisClient.connect();
        console.log("[Redis] Connected successfully.");
    }
};
exports.connectRedis = connectRedis;
exports.redisConfig = {
    getRedisLimitKey: (prefix, identifier) => `rate_limit:${prefix}:${identifier}`,
};
