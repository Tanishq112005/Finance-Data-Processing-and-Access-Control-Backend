"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const finance_service_1 = require("../finance.service");
const finance_repository_1 = require("../../repository/finance.repository");
const finance_producer_1 = require("../../rabbitmq/producers/finance-producer");
const redis_1 = require("../../lib/redis");
// Mock the dependencies
jest.mock("../../repository/finance.repository", () => ({
    financeRepository: {
        findMany: jest.fn(),
        count: jest.fn(),
        findById: jest.fn(),
        getDashboardStats: jest.fn()
    }
}));
jest.mock("../../rabbitmq/producers/finance-producer", () => ({
    financeProducer: {
        dispatchJob: jest.fn()
    }
}));
jest.mock("../../lib/redis", () => ({
    redisClient: {
        hSet: jest.fn(),
        hGetAll: jest.fn()
    }
}));
describe("FinanceService", () => {
    const financeService = new finance_service_1.FinanceService();
    const mockUserId = "user-123";
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("createRecord", () => {
        it("should successfully create a record, update cache, and dispatch a job", async () => {
            const data = {
                amount: 1500,
                type: "INCOME",
                category: "Salary",
                date: new Date(),
                description: "Monthly salary"
            };
            const result = await financeService.createRecord(mockUserId, data);
            expect(result).toBeDefined();
            expect(result.createdById).toBe(mockUserId);
            expect(result.amount).toBe(1500);
            // Verify write-behind caching is invoked
            expect(redis_1.redisClient.hSet).toHaveBeenCalledTimes(1);
            expect(redis_1.redisClient.hSet).toHaveBeenCalledWith(`user:${mockUserId}:records_cache`, result.id, expect.any(String));
            // Verify event is produced to RabbitMQ
            expect(finance_producer_1.financeProducer.dispatchJob).toHaveBeenCalledTimes(1);
            expect(finance_producer_1.financeProducer.dispatchJob).toHaveBeenCalledWith({
                action: "CREATE",
                userId: mockUserId,
                recordId: result.id,
                data: data
            });
        });
    });
    describe("getDashboardSummary", () => {
        it("should calculate correct dashboard summaries from db stats", async () => {
            // Mock db response
            finance_repository_1.financeRepository.getDashboardStats.mockResolvedValue({
                totals: [
                    { type: 'INCOME', _sum: { amount: 5000 } },
                    { type: 'EXPENSE', _sum: { amount: 2000 } }
                ],
                incomeCategories: [
                    { category: 'Salary', _sum: { amount: 5000 } }
                ],
                expenseCategories: [
                    { category: 'Food', _sum: { amount: 1500 } },
                    { category: 'Rent', _sum: { amount: 500 } }
                ],
                recentActivity: [],
                trendsData: [
                    { date: new Date('2024-03-15'), type: 'INCOME', amount: 5000 },
                    { date: new Date('2024-03-20'), type: 'EXPENSE', amount: 2000 }
                ]
            });
            const summary = await financeService.getDashboardSummary(mockUserId);
            expect(finance_repository_1.financeRepository.getDashboardStats).toHaveBeenCalledWith(mockUserId);
            expect(summary.totalIncome).toBe(5000);
            expect(summary.totalExpense).toBe(2000);
            expect(summary.netBalance).toBe(3000); // 5000 - 2000
            expect(summary.incomeByCategory).toHaveLength(1);
            expect(summary.expenseByCategory).toHaveLength(2);
            expect(summary.monthlyTrends).toHaveLength(1);
            const marchTrend = summary.monthlyTrends[0];
            expect(marchTrend.month).toBe('2024-03');
            expect(marchTrend.income).toBe(5000);
            expect(marchTrend.expense).toBe(2000);
        });
    });
    describe("updateRecord", () => {
        it("should throw a 404 error if record is not found", async () => {
            finance_repository_1.financeRepository.findById.mockResolvedValue(null);
            try {
                await financeService.updateRecord(mockUserId, "nonexistent", {});
                throw new Error("Should have thrown");
            }
            catch (e) {
                expect(e.message).toBe("Record not found");
                expect(e.errors.status).toBe(404);
            }
        });
        it("should throw a 403 error if user is not authorized to update", async () => {
            finance_repository_1.financeRepository.findById.mockResolvedValue({ id: "rec1", createdById: "other-user" });
            try {
                await financeService.updateRecord(mockUserId, "rec1", {});
                throw new Error("Should have thrown");
            }
            catch (e) {
                expect(e.message).toBe("Not authorized to update this record");
                expect(e.errors.status).toBe(403);
            }
        });
    });
});
