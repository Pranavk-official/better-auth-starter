import { z } from "zod";
import { UserRole } from "@prisma/generated/client";

export const setRoleSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  role: z.enum(UserRole),
});
export type SetRoleInput = z.infer<typeof setRoleSchema>;

export const banUserSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  banReason: z.string().max(500).optional(),
});
export type BanUserInput = z.infer<typeof banUserSchema>;

export const userIdSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});
export type UserIdInput = z.infer<typeof userIdSchema>;
