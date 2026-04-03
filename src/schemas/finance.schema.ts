import { z } from "zod";

export const CreateRecordSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category is required"),
  date: z.string().datetime({ message: "Invalid date format, expect ISO 8601" }), 
  description: z.string().optional(),
});

export const UpdateRecordSchema = CreateRecordSchema.partial();
