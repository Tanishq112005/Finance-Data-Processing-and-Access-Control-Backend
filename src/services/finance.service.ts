import { financeRepository } from "../repository/finance.repository";
import { financeProducer } from "../rabbitmq/producers/finance-producer";
import { redisClient } from "../lib/redis";
import ApiError from "../utils/ApiError";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export class FinanceService {
  async createRecord(userId: string, data: any) {
    const recordId = randomUUID();
    const record = { 
      id: recordId, 
      ...data, 
      createdById: userId, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };

    await redisClient.hSet(
      `user:${userId}:records_cache`,
      recordId,
      JSON.stringify(record)
    );

    await financeProducer.dispatchJob({ action: "CREATE", userId, recordId, data });

    return record;
  }

  async getRecords(userId: string, query: any) {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.FinancialRecordWhereInput = { createdById: userId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    let records = await financeRepository.findMany(where, skip, take);
    const total = await financeRepository.count(where);

    const cachedRecords = await redisClient.hGetAll(`user:${userId}:records_cache`);
    const uncommitted = Object.values(cachedRecords).map(r => JSON.parse(r));

    let merged = [...records] as any[];
    
    if (uncommitted.length > 0) {
       for (const un of uncommitted) {
          const idx = merged.findIndex(r => r.id === un.id);
          if (idx !== -1) {
             merged[idx] = { ...merged[idx], ...un };
          } else if (!un.isDeleted) {
             merged.unshift(un);
          }
       }
    }
    
    merged = merged.filter((r) => !r.isDeleted);

    return {
      records: merged,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / take)
      }
    };
  }

  async updateRecord(userId: string, recordId: string, data: any) {
    const record = await financeRepository.findById(recordId);
    if (!record) { throw new ApiError("Record not found", { status: 404 }); }
    if (record.createdById !== userId) { throw new ApiError("Not authorized to update this record", { status: 403 }); }

    const updatedRecord = { ...record, ...data };
    await redisClient.hSet(
      `user:${userId}:records_cache`,
      recordId,
      JSON.stringify(updatedRecord)
    );

    await financeProducer.dispatchJob({ action: "UPDATE", userId, recordId, data });

    return updatedRecord;
  }

  async deleteRecord(userId: string, recordId: string) {
    const record = await financeRepository.findById(recordId);
    if (!record) { throw new ApiError("Record not found", { status: 404 }); }
    if (record.createdById !== userId) { throw new ApiError("Not authorized to delete this record", { status: 403 }); }

    await redisClient.hSet(
      `user:${userId}:records_cache`,
      recordId,
      JSON.stringify({ id: recordId, isDeleted: true })
    );

    await financeProducer.dispatchJob({ action: "DELETE", userId, recordId });

    return { success: true };
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
