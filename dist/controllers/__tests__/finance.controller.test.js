"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const finance_controller_1 = require("../finance.controller");
const finance_service_1 = require("../../services/finance.service");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
jest.mock("../../services/finance.service", () => ({
    financeService: {
        createRecord: jest.fn(),
        getDashboardSummary: jest.fn()
    }
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Dummy auth middleware to bypass real auth and inject user
app.use((req, res, next) => {
    req.user = { id: "admin-id", role: "ADMIN" };
    next();
});
// Since we're unit testing the controller, we only map the routes we need
app.post("/finance", finance_controller_1.financeController.createRecord.bind(finance_controller_1.financeController));
app.get("/finance/dashboard/summary", finance_controller_1.financeController.getDashboardSummary.bind(finance_controller_1.financeController));
// Generic error handler to mimic server.ts behaviour
app.use((err, req, res, next) => {
    if (err instanceof ApiError_1.default) {
        return res.status(err.errors?.status || 500).json(err);
    }
    return res.status(500).json(new ApiError_1.default("Internal Server Error"));
});
describe("FinanceController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("POST /finance", () => {
        it("should return 400 Bad Request if validation fails (missing fields)", async () => {
            const response = await (0, supertest_1.default)(app).post("/finance").send({});
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Validation error");
            // Service should not be called if zod validation fails
            expect(finance_service_1.financeService.createRecord).not.toHaveBeenCalled();
        });
        it("should return 201 Created on valid payload", async () => {
            const payload = {
                amount: 1500,
                type: "INCOME",
                category: "Salary",
                date: "2024-03-20T10:00:00.000Z",
                description: "Monthly paycheck"
            };
            finance_service_1.financeService.createRecord.mockResolvedValue({
                id: "record-123",
                ...payload
            });
            const response = await (0, supertest_1.default)(app).post("/finance").send(payload);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("message", "Record created successfully");
            expect(response.body.data).toHaveProperty("id", "record-123");
            expect(finance_service_1.financeService.createRecord).toHaveBeenCalledWith("admin-id", expect.any(Object));
        });
    });
    describe("GET /finance/dashboard/summary", () => {
        it("should return 200 OK and dashboard data", async () => {
            const mockSummary = {
                totalIncome: 5000,
                totalExpense: 2000,
                netBalance: 3000,
                incomeByCategory: [],
                expenseByCategory: [],
                recentActivity: [],
                monthlyTrends: []
            };
            finance_service_1.financeService.getDashboardSummary.mockResolvedValue(mockSummary);
            const response = await (0, supertest_1.default)(app).get("/finance/dashboard/summary");
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message", "Dashboard summary fetched successfully");
            expect(response.body.data).toEqual(mockSummary);
            expect(finance_service_1.financeService.getDashboardSummary).toHaveBeenCalledWith("admin-id");
        });
    });
});
