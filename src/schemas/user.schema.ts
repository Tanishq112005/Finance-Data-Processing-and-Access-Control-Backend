import { z } from "zod";
import { Role } from "@prisma/client";

export const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
