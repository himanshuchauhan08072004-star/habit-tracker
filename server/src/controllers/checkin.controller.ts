import { Request, Response } from "express";
import { Habit } from "../models/Habit";
import { CheckIn } from "../models/CheckIn";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../middleware/errorHandler";
import {
  getTodayLocalDate,
  localDateToUtcInstant,
  utcToLocalDate,
} from "../services/localDay.service";
import { computeStreaks } from "../services/streak.service";

export const createCheckIn = asyncHandler(async (req: Request, res: Response) => {
  const { userId, timezone } = req.auth!;
  const { localDate } = req.body as { localDate: string };

  // Validation 2 — ownership (generic 404 if not owned/doesn't exist)
  const habit = await Habit.findOne({ _id: req.params.habitId, userId });
  if (!habit) {
    throw new ApiError(404, "HABIT_NOT_FOUND", "Habit not found.");
  }

  // Validation 4 — future date, computed strictly from the user's timezone
  const todayLocalDate = getTodayLocalDate(timezone);
  if (localDate > todayLocalDate) {
    throw new ApiError(400, "FUTURE_DATE", "You cannot check in for a future date.");
  }

  // Validation 5 — before habit creation, compared as local dates
  const habitCreatedLocalDate = utcToLocalDate(habit.createdAt, timezone);
  if (localDate < habitCreatedLocalDate) {
    throw new ApiError(
      400,
      "DATE_BEFORE_HABIT",
      "You cannot check in for a date before this habit was created."
    );
  }

  // Validation 6 — duplicate local day (friendly pre-check; the unique DB
  // index below is the authoritative, race-safe guarantee).
  const existing = await CheckIn.findOne({ habitId: habit._id, localDate });
  if (existing) {
    throw new ApiError(
      409,
      "DUPLICATE_CHECK_IN",
      `You have already checked in for ${localDate}. Only one check-in is allowed per local day.`
    );
  }

  const checkedInAt =
    localDate === todayLocalDate ? new Date() : localDateToUtcInstant(localDate, timezone);

  // The unique (habitId, localDate) index is the final backstop against
  // race conditions — if two requests slip past the check above at the
  // same time, one of these inserts will throw a duplicate-key error,
  // which errorHandler.ts translates into the same DUPLICATE_CHECK_IN response.
  const checkIn = await CheckIn.create({
    userId,
    habitId: habit._id,
    localDate,
    checkedInAt,
  });

  const allCheckIns = await CheckIn.find({ habitId: habit._id }).select("localDate");
  const { currentStreak, longestStreak } = computeStreaks(
    allCheckIns.map((c) => c.localDate),
    todayLocalDate
  );

  res.status(201).json({
    success: true,
    data: {
      checkIn: { localDate: checkIn.localDate, checkedInAt: checkIn.checkedInAt },
      currentStreak,
      longestStreak,
    },
  });
});

export const listCheckIns = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.auth!;

  const habit = await Habit.findOne({ _id: req.params.habitId, userId });
  if (!habit) {
    throw new ApiError(404, "HABIT_NOT_FOUND", "Habit not found.");
  }

  const checkIns = await CheckIn.find({ habitId: habit._id })
    .sort({ localDate: -1 })
    .select("localDate checkedInAt");

  res.json({
    success: true,
    data: {
      checkIns: checkIns.map((c) => ({ localDate: c.localDate, checkedInAt: c.checkedInAt })),
    },
  });
});
