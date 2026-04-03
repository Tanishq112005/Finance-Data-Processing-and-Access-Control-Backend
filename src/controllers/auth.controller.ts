import { PrismaClient, User } from "@prisma/client";
import { database } from "../lib/db";
import { OTP_EXPIRE_TIME } from "../config/env";
import { emailProducer } from "../rabbitmq/producers/email-producer";
import { userRepository } from "../repository/user.repository";
import { email_data } from "../types/email.worker.types";
import {
  jwtPayloadAccessToken,
  jwtPayloadRefershToken,
} from "../types/jwt.types";
import { userDetails, userSignInputDetails } from "../types/user.types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { random6digitnumber } from "../utils/generateOtp";
import {
  generateAccessToken,
  generateRefershToken,
  verifyRefershToken,
} from "../utils/jwtToken";
import { comparePasswords, hashPassword } from "../utils/password";
import { redisClient } from "../lib/redis";

export class AuthController {
  private db: PrismaClient;
  private redis: any;
  private user: typeof userRepository;

  constructor(dbClient: PrismaClient) {
    this.db = dbClient;
    this.redis = redisClient;
    this.user = userRepository;
  }

  private getRedisEmailKey(email: string) {
    return `otp:${email}`;
  }

  public createUser = async (req: any, res: any) => {
    const { name, email, password, role } = req.body;

    try {
      const hashedPassword: string = await hashPassword(password);

      const checkingUserPresent = await this.user.findByEmail(email);
      if (checkingUserPresent && checkingUserPresent.isVerified) {
        return res
          .status(409)
          .json(new ApiError("User already exists and is verified."));
      }

      if (!checkingUserPresent) {
        await this.user.create({
          name: name,
          email: email,
          passwordHash: hashedPassword,
          role: role,
        });
      }

      const otp = random6digitnumber();
      const redis_key = this.getRedisEmailKey(email);
      const otp_expire_time = Number(OTP_EXPIRE_TIME) || 300;

      const payload: email_data = {
        email_to: email,
        subject: "Verify Account",
        content: `Your verification OTP is ${otp} and it will expire after ${
          otp_expire_time / 60
        } minutes`,
      };

      await emailProducer.sendOtp(payload);

      if (!this.redis) {
        console.error("Redis client is missing");
        return res.status(500).json(new ApiError("Redis configuration error."));
      }

      console.log("Saving OTP to Redis...");
      await this.redis.set(redis_key, otp, "EX", otp_expire_time);
      console.log("OTP saved successfully.");

      return res.status(200).json(new ApiResponse("OTP sent successfully."));
    } catch (err: any) {
      console.error("[AuthController] createUser error:", err);
      return res
        .status(500)
        .json(
          new ApiError("Error in user creation or sending the OTP", {
            details: err.message,
          }),
        );
    }
  };

  public verifySignupOtp = async (req: any, res: any) => {
    const { email, otp } = req.body;

    try {
      const key = this.getRedisEmailKey(email);
      const storedOtp = await this.redis.get(key);

      if (!storedOtp || storedOtp !== String(otp)) {
        return res.status(404).json(new ApiError("OTP is expired or invalid."));
      }

      await this.redis.del(key);
      await this.user.changingIsVerifiedStatus(email);

      const userFound = await this.user.findByEmail(email);
      if (!userFound)
        return res
          .status(404)
          .json(new ApiError("User not found after verification."));

      await this.user.creatingStudent(userFound.id);

      const payload: jwtPayloadAccessToken = {
        id: userFound.id,
        email: userFound.email,
        role: userFound.role,
      };

      const accessToken: string = generateAccessToken(payload);
      const refreshToken = generateRefershToken(
        { id: userFound.id, email: userFound.email },
        "1d",
      );

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
        .json(
          new ApiResponse("Account verified and logged in successfully", {
            accessToken,
          }),
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(
          new ApiError("Error in verifying signup OTP", {
            details: err.message,
          }),
        );
    }
  };

  public verifyForgotPasswordOtp = async (req: any, res: any) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(new ApiError("Email and OTP are required."));
    }

    try {
      const key = this.getRedisEmailKey(email);
      const storedOtp = await this.redis.get(key);

      if (!storedOtp || storedOtp !== String(otp)) {
        return res.status(400).json(new ApiError("OTP is expired or invalid."));
      }

      await this.redis.del(key);
      const userFound = await this.user.findByEmail(email);

      if (!userFound) {
        return res.status(404).json(new ApiError("User account not found."));
      }

      const payload: jwtPayloadAccessToken = {
        id: userFound.id,
        email: userFound.email,
        role: userFound.role,
      };
      const accessToken: string = generateAccessToken(payload);

      return res
        .status(200)
        .json(new ApiResponse("OTP verified successfully.", { accessToken }));
    } catch (err: any) {
      return res
        .status(500)
        .json(
          new ApiError("Error verifying forgot password OTP", {
            details: err.message,
          }),
        );
    }
  };

  public forgotPasswordVerification = async (req: any, res: any) => {
    const { email } = req.body;
    try {
      const userFound = await this.user.findByEmail(email);
      if (userFound) {
        const otp = random6digitnumber();
        const redis_key = this.getRedisEmailKey(email);
        const otp_expire_time = Number(OTP_EXPIRE_TIME) || 300;

        const payload: email_data = {
          email_to: email,
          subject: "Forgot Password OTP",
          content: `Your OTP to reset password is ${otp}. It will expire after ${otp_expire_time / 60} minutes.`,
        };

        await emailProducer.sendOtp(payload);
        await this.redis.set(redis_key, otp, "EX", otp_expire_time);
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            "If an account exists, a code has been sent to your email.",
          ),
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(
          new ApiError("Error in sending host password OTP", {
            details: err.message,
          }),
        );
    }
  };

  public forgotPasswordChange = async (req: any, res: any) => {
    const { password } = req.body;
    try {
      const userId = (req as any).user.id;
      const userFound = await this.user.findById(userId);

      if (!userFound) {
        return res
          .status(404)
          .json(new ApiError("User not found during password change."));
      }

      const hashedPassword: string = await hashPassword(password);
      await this.user.updatePassword({
        id: userId,
        newPasswordHash: hashedPassword,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            "Password changed successfully. Please log in again.",
          ),
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(
          new ApiError("Error in changing password", { details: err.message }),
        );
    }
  };

  public login = async (req: any, res: any) => {
    const { email, password, rememberMe } = req.body;
    try {
      const userFound = await this.user.findByEmail(email);
      if (!userFound) {
        return res.status(404).json(new ApiError("User not found."));
      }

      const valid = await comparePasswords(password, userFound.passwordHash);
      if (!valid) {
        return res.status(401).json(new ApiError("Invalid password."));
      }

      const payload: jwtPayloadAccessToken = {
        id: userFound.id,
        email: userFound.email,
        role: userFound.role,
      };

      const accessToken: string = generateAccessToken(payload);
      const refreshTokenExpiry = rememberMe ? "30d" : "1d";
      const refreshToken = generateRefershToken(
        { id: userFound.id, email: userFound.email },
        refreshTokenExpiry,
      );

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
        .json(new ApiResponse("Login successful.", { accessToken }));
    } catch (err: any) {
      return res
        .status(500)
        .json(
          new ApiError("Error in verifying login credentials", {
            details: err.message,
          }),
        );
    }
  };

  public refreshToken = async (req: any, res: any) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res
        .status(401)
        .json(new ApiError("Unauthorized. No refresh token provided."));
    }

    try {
      const decoded = await verifyRefershToken(incomingRefreshToken);
      const userId = decoded.id;
      const userFound: User | any = await this.user.findById(userId);

      if (!userFound || userFound.refreshToken !== incomingRefreshToken) {
        return res.status(401).json(new ApiError("Invalid refresh token."));
      }

      const newAccessToken = generateAccessToken({
        id: userFound.id,
        email: userFound.email,
        role: userFound.role,
      });

      return res
        .status(200)
        .json(
          new ApiResponse("Access token refreshed.", {
            accessToken: newAccessToken,
          }),
        );
    } catch (err: any) {
      res.clearCookie("refreshToken");
      return res
        .status(401)
        .json(new ApiError("Session expired. Please login again."));
    }
  };
}

export const authController = new AuthController(database);
