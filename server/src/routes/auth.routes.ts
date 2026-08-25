import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { registerSchema, loginSchema } from "../utils/validation";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
