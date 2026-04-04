"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const user_schema_1 = require("../schemas/user.schema");
class UserController {
    async getAllUsers(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const result = await user_service_1.userService.getAllUsers(page, limit);
            res.status(200).json(new ApiResponse_1.default("Users fetched successfully", result));
        }
        catch (error) {
            res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
        }
    }
    async updateUserRole(req, res) {
        try {
            const validatedData = user_schema_1.UpdateUserRoleSchema.parse(req.body);
            const user = await user_service_1.userService.updateUserRole(req.user.id, req.params.id, validatedData.role);
            res.status(200).json(new ApiResponse_1.default("User role updated successfully", user));
        }
        catch (error) {
            if (error.name === "ZodError") {
                return res.status(400).json(new ApiError_1.default("Validation error", { details: error.errors }));
            }
            res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
        }
    }
    async updateUserStatus(req, res) {
        try {
            const validatedData = user_schema_1.UpdateUserStatusSchema.parse(req.body);
            const user = await user_service_1.userService.updateUserStatus(req.user.id, req.params.id, validatedData.isActive);
            res.status(200).json(new ApiResponse_1.default("User status updated successfully", user));
        }
        catch (error) {
            if (error.name === "ZodError") {
                return res.status(400).json(new ApiError_1.default("Validation error", { details: error.errors }));
            }
            res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
