import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwtToken";
import { userRepository } from "../repository/user.repository";

// Extend express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const isAuthenticated = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        new ApiError("Not authorized, no token provided", { status: 401 }),
      );
    }

    const decoded: any = verifyAccessToken(token);

    if (decoded instanceof Error) {
      return next(
        new ApiError("Not authorized, token failed", { status: 401 }),
      );
    }

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return next(new ApiError("User not found", { status: 404 }));
    }

    if (!user.isActive) {
      return next(new ApiError("User account is inactive", { status: 403 }));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[AuthMiddleware] Error:", error);
    next(new ApiError("Not authorized, token failed", { status: 401 }));
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `Role (${req.user?.role || "Unknown"}) is not allowed to access this resource`,
          { status: 403 },
        ),
      );
    }
    next();
  };
};
