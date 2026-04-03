import { createClient } from "redis";
import { REDIS_URL } from "../config/env";

export const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on("error", (err) => console.error("[Redis] Client error:", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("[Redis] Connected successfully.");
  }
};

export const redisConfig = {
  getRedisLimitKey: (prefix: string, identifier: string): string =>
    `rate_limit:${prefix}:${identifier}`,
};
