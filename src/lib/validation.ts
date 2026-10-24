import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(100, "Name is too long"),
});
