import { Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { AuthRequest } from '../auth/auth.middleware';
import { successResponse } from '../../shared/utils/response';

/**
 * Get dashboard summary with key metrics (requires authentication)
 */
export async function getSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await dashboardService.getSummary();

    res.json(successResponse(summary));
  } catch (error) {
    next(error);
  }
}

/**
 * Get top products by revenue (requires authentication)
 */
export async function getTopProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 5;
    const topProducts = await dashboardService.getTopProducts(limit);

    res.json(successResponse(topProducts));
  } catch (error) {
    next(error);
  }
}

/**
 * Get top customers by spending (requires authentication)
 */
export async function getTopCustomers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const topCustomers = await dashboardService.getTopCustomers(limit);

    res.json(successResponse(topCustomers));
  } catch (error) {
    next(error);
  }
}

/**
 * Get products with low stock (requires authentication)
 */
export async function getLowStockProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lowStockProducts = await dashboardService.getLowStockProducts();

    res.json(successResponse(lowStockProducts));
  } catch (error) {
    next(error);
  }
}

/**
 * Get sales chart data (requires authentication)
 */
export async function getSalesChart(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const days = parseInt(req.query.days as string, 10) || 30;
    const chartData = await dashboardService.getSalesChart(days);

    res.json(successResponse(chartData));
  } catch (error) {
    next(error);
  }
}
