import express from "express";
import request from "supertest";
import { financeController } from "../finance.controller";
import { financeService } from "../../services/finance.service";
import ApiError from "../../utils/ApiError";

jest.mock("../../services/finance.service", () => ({
  financeService: {
    createRecord: jest.fn(),
    getDashboardSummary: jest.fn()
  }
}));

const app = express();
app.use(express.json());

// Dummy auth middleware to bypass real auth and inject user
app.use((req, res, next) => {
  (req as any).user = { id: "admin-id", role: "ADMIN" };
  next();
});

// Since we're unit testing the controller, we only map the routes we need
app.post("/finance", financeController.createRecord.bind(financeController));
app.get("/finance/dashboard/summary", financeController.getDashboardSummary.bind(financeController));

// Generic error handler to mimic server.ts behaviour
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.errors?.status || 500).json(err);
  }
  return res.status(500).json(new ApiError("Internal Server Error"));
});

describe("FinanceController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /finance", () => {
    it("should return 400 Bad Request if validation fails (missing fields)", async () => {
      const response = await request(app).post("/finance").send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Validation error");
      // Service should not be called if zod validation fails
      expect(financeService.createRecord).not.toHaveBeenCalled();
    });

    it("should return 201 Created on valid payload", async () => {
      const payload = {
        amount: 1500,
        type: "INCOME",
        category: "Salary",
        date: "2024-03-20T10:00:00.000Z",
        description: "Monthly paycheck"
      };

      (financeService.createRecord as jest.Mock).mockResolvedValue({
        id: "record-123",
        ...payload
      });

      const response = await request(app).post("/finance").send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Record created successfully");
      expect(response.body.data).toHaveProperty("id", "record-123");
      expect(financeService.createRecord).toHaveBeenCalledWith("admin-id", expect.any(Object));
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

      (financeService.getDashboardSummary as jest.Mock).mockResolvedValue(mockSummary);

      const response = await request(app).get("/finance/dashboard/summary");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Dashboard summary fetched successfully");
      expect(response.body.data).toEqual(mockSummary);
      expect(financeService.getDashboardSummary).toHaveBeenCalledWith("admin-id");
    });
  });
});
