import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(" ");
      throw new ApiError(400, "VALIDATION_ERROR", message);
    }
    req.body = result.data;
    next();
  };
}
