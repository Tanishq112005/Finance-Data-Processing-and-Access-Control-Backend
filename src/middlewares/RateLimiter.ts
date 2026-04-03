import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { redisClient, redisConfig } from "../lib/redis";
import { MAX_ATTEMPTS, WINDOW_SIZE } from "../config/env";

export class RateLimiter {
  private redis: typeof redisClient;
  private maxAttempts: number;
  private windowSize: number;
  private keyPrefix: string;

  constructor(
    keyPrefix: string,
    maxAttempts = MAX_ATTEMPTS,
    windowSize = WINDOW_SIZE,
  ) {
    this.redis = redisClient;
    this.maxAttempts = maxAttempts;
    this.windowSize = windowSize;
    this.keyPrefix = keyPrefix;
  }

  limit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.body?.email || req.body?.phoneNumber || req.ip;

      if (!identifier) {
        return next(new ApiError("Missing identifier for rate limiting"));
      }

      const key = redisConfig.getRedisLimitKey(this.keyPrefix, identifier);
      const currentTime = Date.now();
      const windowStart = currentTime - this.windowSize * 1000;

      const multi = this.redis.multi();

      multi.zRemRangeByScore(key, 0, windowStart);
      multi.zCard(key);
      multi.zAdd(key, { score: currentTime, value: currentTime.toString() });
      multi.expire(key, this.windowSize + 1);

      const results = await multi.exec();

      const requestCount = results ? (results[1] as unknown as number) : 0;

      if (requestCount >= this.maxAttempts) {
        return res
          .status(429)
          .json(
            new ApiError(
              `Too many requests. Please try again in ${this.windowSize} seconds.`,
            ),
          );
      }

      next();
    } catch (error) {
      console.error("[RateLimiter] Error:", error);
      next();
    }
  };
}
