import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

/** Wraps an async controller so thrown/rejected errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  // Mongo duplicate-key error is the DB-level backstop for the unique
  // (habitId, localDate) index — translate it to our standard error shape.
  if (isMongoDuplicateKeyError(err)) {
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_CHECK_IN",
        message: "You have already checked in for this local day.",
      },
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
  });
}

function isMongoDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}
