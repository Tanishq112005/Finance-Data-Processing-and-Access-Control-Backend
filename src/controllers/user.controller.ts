import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { userService } from "../services/user.service";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { UpdateUserRoleSchema, UpdateUserStatusSchema } from "../schemas/user.schema";

export class UserController {
  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await userService.getAllUsers(page, limit);
      res.status(200).json(new ApiResponse("Users fetched successfully", result));
    } catch (error: any) {
      res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
    }
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = UpdateUserRoleSchema.parse(req.body);
      const user = await userService.updateUserRole(req.user.id, req.params.id as string, validatedData.role);
      res.status(200).json(new ApiResponse("User role updated successfully", user));
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json(new ApiError("Validation error", { details: error.errors }));
      }
      res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
    }
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = UpdateUserStatusSchema.parse(req.body);
      const user = await userService.updateUserStatus(req.user.id, req.params.id as string, validatedData.isActive);
      res.status(200).json(new ApiResponse("User status updated successfully", user));
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json(new ApiError("Validation error", { details: error.errors }));
      }
      res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
    }
  }
}

export const userController = new UserController();
