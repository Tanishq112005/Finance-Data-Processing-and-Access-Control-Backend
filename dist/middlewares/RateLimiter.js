"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const redis_1 = require("../lib/redis");
const env_1 = require("../config/env");
class RateLimiter {
    redis;
    maxAttempts;
    windowSize;
    keyPrefix;
    constructor(keyPrefix, maxAttempts = env_1.MAX_ATTEMPTS, windowSize = env_1.WINDOW_SIZE) {
        this.redis = redis_1.redisClient;
        this.maxAttempts = maxAttempts;
        this.windowSize = windowSize;
        this.keyPrefix = keyPrefix;
    }
    limit = async (req, res, next) => {
        try {
            const identifier = req.body?.email || req.body?.phoneNumber || req.ip;
            if (!identifier) {
                return next(new ApiError_1.default("Missing identifier for rate limiting"));
            }
            const key = redis_1.redisConfig.getRedisLimitKey(this.keyPrefix, identifier);
            const currentTime = Date.now();
            const windowStart = currentTime - this.windowSize * 1000;
            const multi = this.redis.multi();
            multi.zRemRangeByScore(key, 0, windowStart);
            multi.zCard(key);
            multi.zAdd(key, { score: currentTime, value: currentTime.toString() });
            multi.expire(key, this.windowSize + 1);
            const results = await multi.exec();
            const requestCount = results ? results[1] : 0;
            if (requestCount >= this.maxAttempts) {
                return res
                    .status(429)
                    .json(new ApiError_1.default(`Too many requests. Please try again in ${this.windowSize} seconds.`));
            }
            next();
        }
        catch (error) {
            console.error("[RateLimiter] Error:", error);
            next();
        }
    };
}
exports.RateLimiter = RateLimiter;
