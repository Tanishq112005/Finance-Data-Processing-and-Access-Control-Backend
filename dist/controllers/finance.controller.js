"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeController = exports.FinanceController = void 0;
const finance_service_1 = require("../services/finance.service");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const finance_schema_1 = require("../schemas/finance.schema");
class FinanceController {
    async createRecord(req, res) {
        try {
            const validatedData = finance_schema_1.CreateRecordSchema.parse(req.body);
            const record = await finance_service_1.financeService.createRecord(req.user.id, {
                ...validatedData,
                date: new Date(validatedData.date)
            });
            res.status(201).json(new ApiResponse_1.default("Record created successfully", record));
        }
        catch (error) {
            if (error.name === "ZodError") {
                res.status(400).json(new ApiError_1.default("Validation error", error.errors));
            }
            else {
                res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
            }
        }
    }
    async getRecords(req, res) {
        try {
            const result = await finance_service_1.financeService.getRecords(req.user.id, req.query);
            res.status(200).json(new ApiResponse_1.default("Records fetched successfully", result));
        }
        catch (error) {
            res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
        }
    }
    async updateRecord(req, res) {
        try {
            const validatedData = finance_schema_1.UpdateRecordSchema.parse(req.body);
            let parsedData = { ...validatedData };
            if (validatedData.date) {
                parsedData.date = new Date(validatedData.date);
            }
            const record = await finance_service_1.financeService.updateRecord(req.user.id, req.params.id, parsedData);
            res.status(200).json(new ApiResponse_1.default("Record updated successfully", record));
        }
        catch (error) {
            if (error.name === "ZodError") {
                res.status(400).json(new ApiError_1.default("Validation error", error.errors));
            }
            else {
                res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
            }
        }
    }
    async deleteRecord(req, res) {
        try {
            await finance_service_1.financeService.deleteRecord(req.user.id, req.params.id);
            res.status(200).json(new ApiResponse_1.default("Record deleted successfully"));
        }
        catch (error) {
            res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
        }
    }
    async getDashboardSummary(req, res) {
        try {
            const summary = await finance_service_1.financeService.getDashboardSummary(req.user.id);
            res.status(200).json(new ApiResponse_1.default("Dashboard summary fetched successfully", summary));
        }
        catch (error) {
            res.status(error.status || 500).json(new ApiError_1.default(error.message || "Internal Server Error"));
        }
    }
}
exports.FinanceController = FinanceController;
exports.financeController = new FinanceController();
