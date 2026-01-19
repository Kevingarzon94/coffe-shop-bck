import { Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { AuthRequest } from './auth.middleware';
import { successResponse } from '../../shared/utils/response';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema';

/**
 * Register a new user
 */
export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data: RegisterInput = req.body;

    const user = await authService.register(data);

    res.status(201).json(
      successResponse(
        user,
        'User registered successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 */
export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password }: LoginInput = req.body;

    const result = await authService.login(email, password);

    res.json(
      successResponse(
        result,
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 */
export async function refresh(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken }: RefreshInput = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.json(
      successResponse(
        result,
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 */
export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User is guaranteed to exist because of authenticate middleware
    const userId = req.user!.id;

    await authService.logout(userId);

    res.json(
      successResponse(
        null,
        'Logout successful'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 */
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User is guaranteed to exist because of authenticate middleware
    const userId = req.user!.id;

    const user = await authService.getProfile(userId);

    res.json(
      successResponse(
        user
      )
    );
  } catch (error) {
    next(error);
  }
}
