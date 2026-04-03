import { database } from "../lib/db";
import { Prisma } from "@prisma/client";

export class FinanceRepository {
  async create(data: Prisma.FinancialRecordUncheckedCreateInput) {
    return await database.financialRecord.create({ data });
  }

  async findById(id: string) {
    return await database.financialRecord.findUnique({ where: { id } });
  }

  async findMany(where: Prisma.FinancialRecordWhereInput, skip?: number, take?: number) {
    return await database.financialRecord.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' }
    });
  }

  async count(where: Prisma.FinancialRecordWhereInput) {
    return await database.financialRecord.count({ where });
  }

  async update(id: string, data: Prisma.FinancialRecordUpdateInput) {
    return await database.financialRecord.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await database.financialRecord.delete({ where: { id } });
  }

  async getDashboardStats(userId: string) {
    const incomeCategories = await database.financialRecord.groupBy({
      by: ['category'],
      where: { createdById: userId, type: 'INCOME' },
      _sum: { amount: true }
    });

    const expenseCategories = await database.financialRecord.groupBy({
      by: ['category'],
      where: { createdById: userId, type: 'EXPENSE' },
      _sum: { amount: true }
    });

    const totals = await database.financialRecord.groupBy({
      by: ['type'],
      where: { createdById: userId },
      _sum: { amount: true }
    });

    return { incomeCategories, expenseCategories, totals };
  }
}

export const financeRepository = new FinanceRepository();
