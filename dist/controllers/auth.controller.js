"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const db_1 = require("../lib/db");
const env_1 = require("../config/env");
const email_producer_1 = require("../rabbitmq/producers/email-producer");
const user_repository_1 = require("../repository/user.repository");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const generateOtp_1 = require("../utils/generateOtp");
const jwtToken_1 = require("../utils/jwtToken");
const password_1 = require("../utils/password");
const redis_1 = require("../lib/redis");
class AuthController {
    db;
    redis;
    user;
    constructor(dbClient) {
        this.db = dbClient;
        this.redis = redis_1.redisClient;
        this.user = user_repository_1.userRepository;
    }
    getRedisEmailKey(email) {
        return `otp:${email}`;
    }
    createUser = async (req, res) => {
        let { name, email, password, role } = req.body;
        email = email.trim().toLowerCase(); // Sanitize input
        try {
            const hashedPassword = await (0, password_1.hashPassword)(password);
            const checkingUserPresent = await this.user.findByEmail(email);
            if (checkingUserPresent && checkingUserPresent.isVerified) {
                return res
                    .status(409)
                    .json(new ApiError_1.default("User already exists and is verified."));
            }
            if (!checkingUserPresent) {
                await this.user.create({
                    name: name,
                    email: email,
                    passwordHash: hashedPassword,
                    role: role,
                });
            }
            const otp = (0, generateOtp_1.random6digitnumber)();
            const redis_key = this.getRedisEmailKey(email);
            const otp_expire_time = Number(env_1.OTP_EXPIRE_TIME) || 300;
            const payload = {
                email_to: email,
                subject: "Verify Account",
                content: `Your verification OTP is ${otp} and it will expire after ${otp_expire_time / 60} minutes`,
            };
            await email_producer_1.emailProducer.sendOtp(payload);
            if (!this.redis) {
                console.error("Redis client is missing");
                return res.status(500).json(new ApiError_1.default("Redis configuration error."));
            }
            console.log(`[Redis] Saving OTP for: ${email} (Key: ${redis_key})`);
            await this.redis.set(redis_key, String(otp), { EX: otp_expire_time });
            console.log("[Redis] OTP saved successfully.");
            return res.status(200).json(new ApiResponse_1.default("OTP sent successfully."));
        }
        catch (err) {
            console.error("[AuthController] createUser error:", err);
            return res
                .status(500)
                .json(new ApiError_1.default("Error in user creation or sending the OTP", {
                details: err.message,
            }));
        }
    };
    verifySignupOtp = async (req, res) => {
        let { email, otp } = req.body;
        email = email.trim().toLowerCase(); // Sanitize input
        try {
            const key = this.getRedisEmailKey(email);
            console.log(`[Redis] Checking OTP for: ${email} (Key: ${key})`);
            const storedOtp = await this.redis.get(key);
            console.log(`[Redis] Store OTP: ${storedOtp} | Provided OTP: ${otp}`);
            if (!storedOtp || storedOtp !== String(otp)) {
                return res.status(404).json(new ApiError_1.default("OTP is expired or invalid."));
            }
            await this.redis.del(key);
            await this.user.changingIsVerifiedStatus(email);
            const userFound = await this.user.findByEmail(email);
            if (!userFound)
                return res
                    .status(404)
                    .json(new ApiError_1.default("User not found after verification."));
            await this.user.creatingStudent(userFound.id);
            const payload = {
                id: userFound.id,
                email: userFound.email,
                role: userFound.role,
            };
            const accessToken = (0, jwtToken_1.generateAccessToken)(payload);
            const refreshToken = (0, jwtToken_1.generateRefershToken)({ id: userFound.id, email: userFound.email }, "1d");
            await this.user.updateRefreshToken(userFound.id, { refreshToken });
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            });
            return res
                .status(200)
                .json(new ApiResponse_1.default("Account verified and logged in successfully", {
                accessToken,
            }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in verifying signup OTP", {
                details: err.message,
            }));
        }
    };
    verifyForgotPasswordOtp = async (req, res) => {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json(new ApiError_1.default("Email and OTP are required."));
        }
        try {
            const key = this.getRedisEmailKey(email);
            const storedOtp = await this.redis.get(key);
            if (!storedOtp || storedOtp !== String(otp)) {
                return res.status(400).json(new ApiError_1.default("OTP is expired or invalid."));
            }
            await this.redis.del(key);
            const userFound = await this.user.findByEmail(email);
            if (!userFound) {
                return res.status(404).json(new ApiError_1.default("User account not found."));
            }
            const payload = {
                id: userFound.id,
                email: userFound.email,
                role: userFound.role,
            };
            const accessToken = (0, jwtToken_1.generateAccessToken)(payload);
            return res
                .status(200)
                .json(new ApiResponse_1.default("OTP verified successfully.", { accessToken }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error verifying forgot password OTP", {
                details: err.message,
            }));
        }
    };
    forgotPasswordVerification = async (req, res) => {
        const { email } = req.body;
        try {
            const userFound = await this.user.findByEmail(email);
            if (userFound) {
                const otp = (0, generateOtp_1.random6digitnumber)();
                const redis_key = this.getRedisEmailKey(email);
                const otp_expire_time = Number(env_1.OTP_EXPIRE_TIME) || 300;
                const payload = {
                    email_to: email,
                    subject: "Forgot Password OTP",
                    content: `Your OTP to reset password is ${otp}. It will expire after ${otp_expire_time / 60} minutes.`,
                };
                await email_producer_1.emailProducer.sendOtp(payload);
                await this.redis.set(redis_key, otp, "EX", otp_expire_time);
            }
            return res
                .status(200)
                .json(new ApiResponse_1.default("If an account exists, a code has been sent to your email."));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in sending host password OTP", {
                details: err.message,
            }));
        }
    };
    forgotPasswordChange = async (req, res) => {
        const { password } = req.body;
        try {
            const userId = req.user.id;
            const userFound = await this.user.findById(userId);
            if (!userFound) {
                return res
                    .status(404)
                    .json(new ApiError_1.default("User not found during password change."));
            }
            const hashedPassword = await (0, password_1.hashPassword)(password);
            await this.user.updatePassword({
                id: userId,
                newPasswordHash: hashedPassword,
            });
            return res
                .status(200)
                .json(new ApiResponse_1.default("Password changed successfully. Please log in again."));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in changing password", { details: err.message }));
        }
    };
    login = async (req, res) => {
        const { email, password, rememberMe } = req.body;
        try {
            const userFound = await this.user.findByEmail(email);
            if (!userFound) {
                return res.status(404).json(new ApiError_1.default("User not found."));
            }
            const valid = await (0, password_1.comparePasswords)(password, userFound.passwordHash);
            if (!valid) {
                return res.status(401).json(new ApiError_1.default("Invalid password."));
            }
            const payload = {
                id: userFound.id,
                email: userFound.email,
                role: userFound.role,
            };
            const accessToken = (0, jwtToken_1.generateAccessToken)(payload);
            const refreshTokenExpiry = rememberMe ? "30d" : "1d";
            const refreshToken = (0, jwtToken_1.generateRefershToken)({ id: userFound.id, email: userFound.email }, refreshTokenExpiry);
            await this.user.updateRefreshToken(userFound.id, { refreshToken });
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000,
                path: "/",
            });
            return res
                .status(200)
                .json(new ApiResponse_1.default("Login successful.", { accessToken }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in verifying login credentials", {
                details: err.message,
            }));
        }
    };
    refreshToken = async (req, res) => {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!incomingRefreshToken) {
            return res
                .status(401)
                .json(new ApiError_1.default("Unauthorized. No refresh token provided."));
        }
        try {
            const decoded = await (0, jwtToken_1.verifyRefershToken)(incomingRefreshToken);
            const userId = decoded.id;
            const userFound = await this.user.findById(userId);
            if (!userFound || userFound.refreshToken !== incomingRefreshToken) {
                return res.status(401).json(new ApiError_1.default("Invalid refresh token."));
            }
            const newAccessToken = (0, jwtToken_1.generateAccessToken)({
                id: userFound.id,
                email: userFound.email,
                role: userFound.role,
            });
            return res
                .status(200)
                .json(new ApiResponse_1.default("Access token refreshed.", {
                accessToken: newAccessToken,
            }));
        }
        catch (err) {
            res.clearCookie("refreshToken");
            return res
                .status(401)
                .json(new ApiError_1.default("Session expired. Please login again."));
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController(db_1.database);
