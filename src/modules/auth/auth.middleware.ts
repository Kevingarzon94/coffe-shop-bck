import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../shared/utils/AppError';
import { AuthPayload } from '../../shared/types';

/**
 * Extended Request type with authenticated user
 */
export interface AuthRequest extends Request {
  user?: AuthPayload;
}

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw AppError.unauthorized('No authorization token provided');
    }

    // Check if header follows Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Invalid authorization format. Use: Bearer <token>');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw AppError.unauthorized('No token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    // Add user to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid or expired token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Token has expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Middleware to check if user has specific role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        AppError.forbidden(
          'You do not have permission to access this resource'
        )
      );
      return;
    }

    next();
  };
}
