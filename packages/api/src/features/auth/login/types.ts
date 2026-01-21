// src/features/users/authenticate-user/authenticate-user.schema.ts
import { z } from "zod";

export const authenticateUserSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type AuthenticateUserDTO = z.infer<typeof authenticateUserSchema>;
