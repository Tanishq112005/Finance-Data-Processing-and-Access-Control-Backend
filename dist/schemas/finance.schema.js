"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRecordSchema = exports.CreateRecordSchema = void 0;
const zod_1 = require("zod");
exports.CreateRecordSchema = zod_1.z.object({
    amount: zod_1.z.number().positive("Amount must be a positive number"),
    type: zod_1.z.enum(["INCOME", "EXPENSE"]),
    category: zod_1.z.string().min(1, "Category is required"),
    date: zod_1.z.string().datetime({ message: "Invalid date format, expect ISO 8601" }),
    description: zod_1.z.string().optional(),
});
exports.UpdateRecordSchema = exports.CreateRecordSchema.partial();
