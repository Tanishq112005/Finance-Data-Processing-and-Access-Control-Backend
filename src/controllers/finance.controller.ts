import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { financeService } from "../services/finance.service";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CreateRecordSchema, UpdateRecordSchema } from "../schemas/finance.schema";

export class FinanceController {
  async createRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = CreateRecordSchema.parse(req.body);
      const record = await financeService.createRecord(req.user.id, {
        ...validatedData,
        date: new Date(validatedData.date)
      });
      res.status(201).json(new ApiResponse("Record created successfully", record));
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json(new ApiError("Validation error", error.errors));
      } else {
        res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
      }
    }
  }

  async getRecords(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await financeService.getRecords(req.user.id, req.query);
      res.status(200).json(new ApiResponse("Records fetched successfully", result));
    } catch (error: any) {
      res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
    }
  }

  async updateRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = UpdateRecordSchema.parse(req.body);
      let parsedData: any = { ...validatedData };
      if (validatedData.date) {
        parsedData.date = new Date(validatedData.date);
      }
      const record = await financeService.updateRecord(req.user.id, req.params.id as string, parsedData);
      res.status(200).json(new ApiResponse("Record updated successfully", record));
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json(new ApiError("Validation error", error.errors));
      } else {
        res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
      }
    }
  }

  async deleteRecord(req: AuthenticatedRequest, res: Response) {
    try {
      await financeService.deleteRecord(req.user.id, req.params.id as string);
      res.status(200).json(new ApiResponse("Record deleted successfully"));
    } catch (error: any) {
      res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
    }
  }

  async getDashboardSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const summary = await financeService.getDashboardSummary(req.user.id);
      res.status(200).json(new ApiResponse("Dashboard summary fetched successfully", summary));
    } catch (error: any) {
      res.status(error.status || 500).json(new ApiError(error.message || "Internal Server Error"));
    }
  }
}

export const financeController = new FinanceController();
