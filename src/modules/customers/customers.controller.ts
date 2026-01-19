import { Response, NextFunction } from 'express';
import * as customersService from './customers.service';
import { AuthRequest } from '../auth/auth.middleware';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { QueryCustomersInput } from './customers.schema';

/**
 * Get all customers with filters (requires authentication)
 */
export async function getCustomers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query: QueryCustomersInput = req.query as any;

    const { customers, total } = await customersService.getCustomers(query);

    res.json(
      paginatedResponse(
        customers,
        total,
        query.page,
        query.limit
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer by ID with purchase history (requires authentication)
 */
export async function getCustomerById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const result = await customersService.getCustomerById(id);

    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer purchase history with pagination (requires authentication)
 */
export async function getCustomerPurchases(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const { purchases, total } = await customersService.getCustomerPurchaseHistory(
      id,
      page,
      limit
    );

    res.json(
      paginatedResponse(
        purchases,
        total,
        page,
        limit
      )
    );
  } catch (error) {
    next(error);
  }
}
