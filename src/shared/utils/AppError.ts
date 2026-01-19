/**
 * Custom application error class for consistent error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 400 Bad Request - Invalid input data
   */
  static badRequest(message = 'Bad request', details?: any): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', true, details);
  }

  /**
   * 401 Unauthorized - Authentication required
   */
  static unauthorized(message = 'Unauthorized', details?: any): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', true, details);
  }

  /**
   * 403 Forbidden - Insufficient permissions
   */
  static forbidden(message = 'Forbidden', details?: any): AppError {
    return new AppError(message, 403, 'FORBIDDEN', true, details);
  }

  /**
   * 404 Not Found - Resource not found
   */
  static notFound(message = 'Resource not found', details?: any): AppError {
    return new AppError(message, 404, 'NOT_FOUND', true, details);
  }

  /**
   * 409 Conflict - Resource already exists
   */
  static conflict(message = 'Resource already exists', details?: any): AppError {
    return new AppError(message, 409, 'CONFLICT', true, details);
  }

  /**
   * 422 Unprocessable Entity - Validation error
   */
  static validation(message = 'Validation error', details?: any): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', true, details);
  }

  /**
   * 500 Internal Server Error - Unexpected error
   */
  static internal(
    message = 'Internal server error',
    details?: any
  ): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', false, details);
  }
}
