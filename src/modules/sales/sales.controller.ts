import { Response, NextFunction } from 'express';
import * as salesService from './sales.service';
import { AuthRequest } from '../auth/auth.middleware';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { CreateSaleInput, QuerySalesInput } from './sales.schema';

/**
 * Create a new sale (public endpoint - anyone can purchase)
 */
export async function createSale(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const saleData: CreateSaleInput = req.body;

    const result = await salesService.createSale(saleData);

    res.status(201).json(
      successResponse(
        result,
        'Sale created successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get all sales with filters (requires authentication)
 */
export async function getSales(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query: QuerySalesInput = req.query as any;

    const { sales, total } = await salesService.getSales(query);

    res.json(
      paginatedResponse(
        sales,
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
 * Get sale by ID with items (requires authentication)
 */
export async function getSaleById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const sale = await salesService.getSaleById(id);

    res.json(successResponse(sale));
  } catch (error) {
    next(error);
  }
}
