import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";

export interface AuthPayload {
  userId: string;
  timezone: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(userId: string, timezone: string): string {
  const payload: AuthPayload = { userId, timezone };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid Authorization header.");
  }

  const token = header.slice("Bearer ".length);
  let decoded: AuthPayload;
  try {
    decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token.");
  }

  // Re-check the user still exists and pull the current timezone, so a
  // stale token can't carry a stale/outdated timezone claim forever.
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "User no longer exists.");
  }

  req.auth = { userId: user._id.toString(), timezone: user.timezone };
  next();
}
