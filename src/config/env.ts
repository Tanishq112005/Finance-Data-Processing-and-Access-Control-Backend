import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: "${key}"`);
  }
  return value;
}

export const PORT = requireEnv("PORT");

export const DATABASE_URL = requireEnv("DATABASE_URL");

export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");

export const REDIS_URL = requireEnv("REDIS_URL");

export const MAX_ATTEMPTS = parseInt(requireEnv("MAX_ATTEMPTS"), 10);
export const WINDOW_SIZE = parseInt(requireEnv("WINDOW_SIZE"), 10);

export const RABBITMQ_URL = requireEnv("RABBITMQ_URL");
export const RABBITMQ_PASSWORD = requireEnv("RABBITMQ_PASSWORD");

export const BREVO_API_KEY = requireEnv("BREVO_API_KEY");
export const BREVO_SENDER_EMAIL = requireEnv("BREVO_SENDER_EMAIL");

export const OTP_EXPIRE_TIME = requireEnv("OTP_EXPIRE_TIME");

export const EMAIL_WORKER_PORT = process.env.EMAIL_WORKER_PORT || "3001";
