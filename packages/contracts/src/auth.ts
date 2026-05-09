import { z } from "zod";

// --- Register ---
export const createUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

// --- Login ---
export const authenticateUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type AuthenticateUserDTO = z.infer<typeof authenticateUserSchema>;

// --- Verify Email ---
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email address"),
});

export type VerifyEmailDTO = z.infer<typeof verifyEmailSchema>;

// --- Password Recovery ---
export const passwordRecoveryRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type PasswordRecoveryRequestDTO = z.infer<typeof passwordRecoveryRequestSchema>;

export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type PasswordResetDTO = z.infer<typeof passwordResetSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type PasswordChangeDTO = z.infer<typeof passwordChangeSchema>;

// --- Refresh Token ---
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshDTO = z.infer<typeof refreshSchema>;

// --- Common Models ---
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  is_active: z.boolean(),
  created_at: z.date().or(z.string()),
});

export type UserDTO = z.infer<typeof userSchema>;
