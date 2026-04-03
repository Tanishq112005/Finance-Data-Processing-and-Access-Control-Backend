import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { RateLimiter } from "../middlewares/RateLimiter";
import { isAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

const registerLimiter = new RateLimiter("register-limit").limit;
const loginLimiter = new RateLimiter("login-limit").limit;
const otpLimiter = new RateLimiter("otp-limit").limit;
const resetLimiter = new RateLimiter("reset-pwd-limit").limit;
const globalAuthLimiter = new RateLimiter("auth-global-limit").limit;

router.post("/register", registerLimiter, authController.createUser);
router.post("/verify-signup", otpLimiter, authController.verifySignupOtp);
router.post("/login", loginLimiter, authController.login);
router.post("/refresh-token", globalAuthLimiter, authController.refreshToken);
router.post(
  "/forgot-password",
  otpLimiter,
  authController.forgotPasswordVerification,
);
router.post(
  "/verify-forgot-password",
  otpLimiter,
  authController.verifyForgotPasswordOtp,
);
router.post(
  "/reset-password",
  isAuthenticated,
  resetLimiter,
  authController.forgotPasswordChange,
);

export default router;
