import { userRepository } from "../repository/user.repository";
import ApiError from "../utils/ApiError";
import { Role } from "@prisma/client";

export class UserService {
  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      userRepository.getAllUsers(skip, limit),
      userRepository.countUsers()
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

  async updateUserRole(adminId: string, targetUserId: string, newRole: Role) {
    if (adminId === targetUserId) {
      throw new ApiError("You cannot change your own role", { status: 400 });
    }
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError("User not found", { status: 404 });
    }

    return await userRepository.updateProfile(targetUserId, { role: newRole });
  }

  async updateUserStatus(adminId: string, targetUserId: string, isActive: boolean) {
    if (adminId === targetUserId) {
      throw new ApiError("You cannot change your own active status", { status: 400 });
    }
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError("User not found", { status: 404 });
    }

    return await userRepository.updateProfile(targetUserId, { isActive });
  }
}

export const userService = new UserService();
