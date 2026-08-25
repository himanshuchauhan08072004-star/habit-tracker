import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { signToken } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const SALT_ROUNDS = 10;

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, timezone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash, timezone });

  const token = signToken(user._id.toString(), user.timezone);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user._id, email: user.email, timezone: user.timezone },
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const token = signToken(user._id.toString(), user.timezone);

  res.json({
    success: true,
    data: {
      token,
      user: { id: user._id, email: user.email, timezone: user.timezone },
    },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "User no longer exists.");
  }
  res.json({
    success: true,
    data: { id: user._id, email: user.email, timezone: user.timezone },
  });
});
