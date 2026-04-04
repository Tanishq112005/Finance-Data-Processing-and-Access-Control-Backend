"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeRepository = exports.FinanceRepository = void 0;
const db_1 = require("../lib/db");
class FinanceRepository {
    async create(data) {
        return await db_1.database.financialRecord.create({ data });
    }
    async findById(id) {
        return await db_1.database.financialRecord.findFirst({ where: { id, deletedAt: null } });
    }
    async findMany(where, skip, take) {
        return await db_1.database.financialRecord.findMany({
            where,
            skip,
            take,
            orderBy: { date: 'desc' }
        });
    }
    async count(where) {
        return await db_1.database.financialRecord.count({ where });
    }
    async update(id, data) {
        return await db_1.database.financialRecord.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return await db_1.database.financialRecord.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
    async getDashboardStats(userId) {
        const incomeCategories = await db_1.database.financialRecord.groupBy({
            by: ['category'],
            where: { createdById: userId, type: 'INCOME', deletedAt: null },
            _sum: { amount: true }
        });
        const expenseCategories = await db_1.database.financialRecord.groupBy({
            by: ['category'],
            where: { createdById: userId, type: 'EXPENSE', deletedAt: null },
            _sum: { amount: true }
        });
        const totals = await db_1.database.financialRecord.groupBy({
            by: ['type'],
            where: { createdById: userId, deletedAt: null },
            _sum: { amount: true }
        });
        const recentActivity = await db_1.database.financialRecord.findMany({
            where: { createdById: userId, deletedAt: null },
            orderBy: { date: 'desc' },
            take: 5
        });
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const trendsData = await db_1.database.financialRecord.findMany({
            where: {
                createdById: userId,
                deletedAt: null,
                date: { gte: sixMonthsAgo }
            },
            select: { amount: true, type: true, date: true }
        });
        return { incomeCategories, expenseCategories, totals, recentActivity, trendsData };
    }
}
exports.FinanceRepository = FinanceRepository;
exports.financeRepository = new FinanceRepository();
