import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../../config/env';

/**
 * Global error handling middleware
 * Catches all errors and formats them into a consistent response structure
 */
export function errorMiddleware(
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        ...(env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
        ...(env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
    return;
  }

  // Handle unknown errors
  console.error('Unexpected error:', error);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred',
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}

/**
 * Middleware to handle 404 Not Found errors
 * Should be placed after all routes
 */
export function notFoundMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = AppError.notFound(
    `Route ${req.method} ${req.path} not found`
  );
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
