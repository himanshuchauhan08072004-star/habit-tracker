import { z } from "zod";
import { isValidTimezone, isValidLocalDateString } from "../services/localDay.service";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  timezone: z.string().refine(isValidTimezone, {
    message: "timezone must be a valid IANA timezone, e.g. Asia/Kolkata.",
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, "Habit name is required.").max(120),
  description: z.string().trim().max(500).optional(),
});

export const updateHabitSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
});

export const checkInSchema = z.object({
  localDate: z
    .string()
    .refine(isValidLocalDateString, { message: "localDate must be a valid YYYY-MM-DD date." }),
});
