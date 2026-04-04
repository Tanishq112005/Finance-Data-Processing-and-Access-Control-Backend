"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserStatusSchema = exports.UpdateUserRoleSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.UpdateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.Role),
});
exports.UpdateUserStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
