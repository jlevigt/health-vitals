/**
 * Base application error that extends native Error
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Validation error for invalid input (400)
 */
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(message = "Validation failed", errors?: Record<string, string[]>) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * Authorization error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}
