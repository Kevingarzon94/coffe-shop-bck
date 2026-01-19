import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as dashboardController from './dashboard.controller';

const router = Router();

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard summary with key metrics
 * @access  Private (requires authentication)
 */
router.get(
  '/summary',
  authenticate,
  dashboardController.getSummary
);

/**
 * @route   GET /api/dashboard/top-products
 * @desc    Get top products by revenue
 * @access  Private (requires authentication)
 * @query   limit - Number of products to return (default: 5)
 */
router.get(
  '/top-products',
  authenticate,
  dashboardController.getTopProducts
);

/**
 * @route   GET /api/dashboard/top-customers
 * @desc    Get top customers by spending
 * @access  Private (requires authentication)
 * @query   limit - Number of customers to return (default: 10)
 */
router.get(
  '/top-customers',
  authenticate,
  dashboardController.getTopCustomers
);

/**
 * @route   GET /api/dashboard/low-stock
 * @desc    Get products with low stock (less than 5 units)
 * @access  Private (requires authentication)
 */
router.get(
  '/low-stock',
  authenticate,
  dashboardController.getLowStockProducts
);

/**
 * @route   GET /api/dashboard/sales-chart
 * @desc    Get sales chart data for the last N days
 * @access  Private (requires authentication)
 * @query   days - Number of days to include (default: 30)
 */
router.get(
  '/sales-chart',
  authenticate,
  dashboardController.getSalesChart
);

export default router;
