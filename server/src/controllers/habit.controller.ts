import { Request, Response } from "express";
import { Habit } from "../models/Habit";
import { CheckIn } from "../models/CheckIn";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../middleware/errorHandler";
import { getTodayLocalDate } from "../services/localDay.service";
import { computeStreaks, isCompletedToday } from "../services/streak.service";

async function loadOwnedHabit(habitId: string, userId: string) {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    // Deliberately generic — never reveal whether the habit exists for someone else.
    throw new ApiError(404, "HABIT_NOT_FOUND", "Habit not found.");
  }
  return habit;
}

export const listHabits = asyncHandler(async (req: Request, res: Response) => {
  const { userId, timezone } = req.auth!;
  const today = getTodayLocalDate(timezone);

  const habits = await Habit.find({ userId }).sort({ createdAt: -1 });

  const data = await Promise.all(
    habits.map(async (habit) => {
      const checkIns = await CheckIn.find({ habitId: habit._id }).select("localDate");
      const localDates = checkIns.map((c) => c.localDate);
      const { currentStreak, longestStreak } = computeStreaks(localDates, today);

      return {
        id: habit._id,
        name: habit.name,
        description: habit.description ?? "",
        createdAt: habit.createdAt,
        currentStreak,
        longestStreak,
        completedToday: isCompletedToday(localDates, today),
      };
    })
  );

  res.json({ success: true, data });
});

export const getHabit = asyncHandler(async (req: Request, res: Response) => {
  const { userId, timezone } = req.auth!;
  const habit = await loadOwnedHabit(req.params.id, userId);
  const today = getTodayLocalDate(timezone);

  const checkIns = await CheckIn.find({ habitId: habit._id }).select("localDate");
  const localDates = checkIns.map((c) => c.localDate);
  const { currentStreak, longestStreak } = computeStreaks(localDates, today);

  res.json({
    success: true,
    data: {
      id: habit._id,
      name: habit.name,
      description: habit.description ?? "",
      createdAt: habit.createdAt,
      currentStreak,
      longestStreak,
      completedToday: isCompletedToday(localDates, today),
    },
  });
});

export const createHabit = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.auth!;
  const { name, description } = req.body;

  const habit = await Habit.create({ userId, name, description });

  res.status(201).json({
    success: true,
    data: {
      id: habit._id,
      name: habit.name,
      description: habit.description ?? "",
      createdAt: habit.createdAt,
      currentStreak: 0,
      longestStreak: 0,
      completedToday: false,
    },
  });
});

export const updateHabit = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.auth!;
  const habit = await loadOwnedHabit(req.params.id, userId);

  if (req.body.name !== undefined) habit.name = req.body.name;
  if (req.body.description !== undefined) habit.description = req.body.description;
  await habit.save();

  res.json({
    success: true,
    data: { id: habit._id, name: habit.name, description: habit.description ?? "" },
  });
});

export const deleteHabit = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.auth!;
  const habit = await loadOwnedHabit(req.params.id, userId);

  await CheckIn.deleteMany({ habitId: habit._id });
  await habit.deleteOne();

  res.json({ success: true, data: { id: habit._id } });
});
