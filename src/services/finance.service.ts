import { financeRepository } from "../repository/finance.repository";
import ApiError from "../utils/ApiError";
import { Prisma } from "@prisma/client";

export class FinanceService {
  async createRecord(userId: string, data: any) {
    return await financeRepository.create({
      ...data,
      createdById: userId
    });
  }

  async getRecords(userId: string, query: any) {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = query;
    
    const where: Prisma.FinancialRecordWhereInput = { createdById: userId };
    
    if (type) where.type = type;
    if (category) where.category = category;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    const records = await financeRepository.findMany(where, skip, take);
    const total = await financeRepository.count(where);
    
    return {
      records,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / take)
      }
    };
  }

  async updateRecord(userId: string, recordId: string, data: any) {
    const record = await financeRepository.findById(recordId);
    if (!record) {
      throw new ApiError("Record not found", { status: 404 });
    }
    
    if (record.createdById !== userId) {
      throw new ApiError("Not authorized to update this record", { status: 403 });
    }
    
    return await financeRepository.update(recordId, data);
  }

  async deleteRecord(userId: string, recordId: string) {
    const record = await financeRepository.findById(recordId);
    if (!record) {
      throw new ApiError("Record not found", { status: 404 });
    }
    
    if (record.createdById !== userId) {
      throw new ApiError("Not authorized to delete this record", { status: 403 });
    }
    
    return await financeRepository.delete(recordId);
  }

  async getDashboardSummary(userId: string) {
    const stats = await financeRepository.getDashboardStats(userId);
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    stats.totals.forEach(t => {
      if (t.type === 'INCOME') totalIncome = t._sum.amount || 0;
      if (t.type === 'EXPENSE') totalExpense = t._sum.amount || 0;
    });
    
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      incomeByCategory: stats.incomeCategories.map(c => ({ category: c.category, amount: c._sum.amount })),
      expenseByCategory: stats.expenseCategories.map(c => ({ category: c.category, amount: c._sum.amount }))
    };
  }
}

export const financeService = new FinanceService();
