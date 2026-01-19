import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';
import { AppError } from './AppError';

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Creates an error API response from an AppError
 */
export function errorResponse(error: AppError): ApiResponse<null> {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  };
}

/**
 * Creates a paginated API response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
  };

  return {
    success: true,
    data,
    meta,
    ...(message && { message }),
  };
}
