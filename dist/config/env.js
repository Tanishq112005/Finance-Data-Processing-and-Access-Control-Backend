"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_WORKER_PORT = exports.OTP_EXPIRE_TIME = exports.BREVO_SENDER_EMAIL = exports.BREVO_API_KEY = exports.RABBITMQ_PASSWORD = exports.RABBITMQ_URL = exports.WINDOW_SIZE = exports.MAX_ATTEMPTS = exports.REDIS_URL = exports.JWT_REFRESH_SECRET = exports.JWT_SECRET = exports.DATABASE_URL = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: "${key}"`);
    }
    return value;
}
exports.PORT = requireEnv("PORT");
exports.DATABASE_URL = requireEnv("DATABASE_URL");
exports.JWT_SECRET = requireEnv("JWT_SECRET");
exports.JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
exports.REDIS_URL = requireEnv("REDIS_URL");
exports.MAX_ATTEMPTS = parseInt(requireEnv("MAX_ATTEMPTS"), 10);
exports.WINDOW_SIZE = parseInt(requireEnv("WINDOW_SIZE"), 10);
exports.RABBITMQ_URL = requireEnv("RABBITMQ_URL");
exports.RABBITMQ_PASSWORD = requireEnv("RABBITMQ_PASSWORD");
exports.BREVO_API_KEY = requireEnv("BREVO_API_KEY");
exports.BREVO_SENDER_EMAIL = requireEnv("BREVO_SENDER_EMAIL");
exports.OTP_EXPIRE_TIME = requireEnv("OTP_EXPIRE_TIME");
exports.EMAIL_WORKER_PORT = process.env.EMAIL_WORKER_PORT || "3001";
