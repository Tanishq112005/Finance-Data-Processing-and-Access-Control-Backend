"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticated = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const jwtToken_1 = require("../utils/jwtToken");
const user_repository_1 = require("../repository/user.repository");
const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = "";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            return next(new ApiError_1.default("Not authorized, no token provided", { status: 401 }));
        }
        const decoded = (0, jwtToken_1.verifyAccessToken)(token);
        if (decoded instanceof Error) {
            return next(new ApiError_1.default("Not authorized, token failed", { status: 401 }));
        }
        const user = await user_repository_1.userRepository.findById(decoded.id);
        if (!user) {
            return next(new ApiError_1.default("User not found", { status: 404 }));
        }
        if (!user.isActive) {
            return next(new ApiError_1.default("User account is inactive", { status: 403 }));
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("[AuthMiddleware] Error:", error);
        next(new ApiError_1.default("Not authorized, token failed", { status: 401 }));
    }
};
exports.isAuthenticated = isAuthenticated;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError_1.default(`Role (${req.user?.role || "Unknown"}) is not allowed to access this resource`, { status: 403 }));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
