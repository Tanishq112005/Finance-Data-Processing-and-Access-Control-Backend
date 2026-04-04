"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_repository_1 = require("../repository/user.repository");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
class UserService {
    async getAllUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            user_repository_1.userRepository.getAllUsers(skip, limit),
            user_repository_1.userRepository.countUsers()
        ]);
        return {
            users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async updateUserRole(adminId, targetUserId, newRole) {
        if (adminId === targetUserId) {
            throw new ApiError_1.default("You cannot change your own role", { status: 400 });
        }
        const targetUser = await user_repository_1.userRepository.findById(targetUserId);
        if (!targetUser) {
            throw new ApiError_1.default("User not found", { status: 404 });
        }
        return await user_repository_1.userRepository.updateProfile(targetUserId, { role: newRole });
    }
    async updateUserStatus(adminId, targetUserId, isActive) {
        if (adminId === targetUserId) {
            throw new ApiError_1.default("You cannot change your own active status", { status: 400 });
        }
        const targetUser = await user_repository_1.userRepository.findById(targetUserId);
        if (!targetUser) {
            throw new ApiError_1.default("User not found", { status: 404 });
        }
        return await user_repository_1.userRepository.updateProfile(targetUserId, { isActive });
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
