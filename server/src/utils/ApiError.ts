export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "HABIT_NOT_FOUND"
  | "DUPLICATE_CHECK_IN"
  | "FUTURE_DATE"
  | "DATE_BEFORE_HABIT"
  | "INVALID_TIMEZONE"
  | "EMAIL_IN_USE"
  | "INVALID_CREDENTIALS"
  | "NOT_FOUND";

export class ApiError extends Error {
  code: ErrorCode;
  status: number;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
