import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createHabitSchema, updateHabitSchema, checkInSchema } from "../utils/validation";
import {
  listHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
} from "../controllers/habit.controller";
import { createCheckIn, listCheckIns } from "../controllers/checkin.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listHabits);
router.post("/", validateBody(createHabitSchema), createHabit);
router.get("/:id", getHabit);
router.patch("/:id", validateBody(updateHabitSchema), updateHabit);
router.delete("/:id", deleteHabit);

router.post("/:habitId/check-ins", validateBody(checkInSchema), createCheckIn);
router.get("/:habitId/check-ins", listCheckIns);

export default router;
