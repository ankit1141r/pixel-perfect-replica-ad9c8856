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

const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep it under ${max} characters`).transform((v) => (v === "" ? null : v));

export const sportSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(60, "Name is too long"),
  description: optionalText(500),
});

export const teamSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(80, "Name is too long"),
  sport_id: z.string().uuid("Pick a sport"),
  description: optionalText(500),
});

const score = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 999), "Scores are whole numbers from 0");

export const matchSchema = z
  .object({
    sport_id: z.string().uuid("Pick a sport"),
    home_team_id: z.string().uuid("Pick the home team"),
    away_team_id: z.string().uuid("Pick the away team"),
    scheduled_at: z.string().min(1, "Pick a date and time").refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date"),
    venue: optionalText(120),
    status: z.enum(["scheduled", "live", "completed", "cancelled"]),
    home_score: score,
    away_score: score,
  })
  .refine((m) => m.home_team_id !== m.away_team_id, { message: "A team can't play itself", path: ["away_team_id"] })
  .refine((m) => m.status !== "completed" || (m.home_score !== null && m.away_score !== null), {
    message: "Enter both scores to complete a match",
    path: ["home_score"],
  });

export const fieldErrors = (e: z.ZodError) =>
  Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message])) as Record<string, string>;
