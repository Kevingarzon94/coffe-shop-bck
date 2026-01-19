import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import * as salesController from './sales.controller';
import {
  createSaleSchema,
  querySalesSchema,
} from './sales.schema';

const router = Router();

/**
 * @route   POST /api/sales
 * @desc    Create a new sale
 * @access  Public (anyone can make a purchase)
 */
router.post(
  '/',
  validate(createSaleSchema),
  salesController.createSale
);

/**
 * @route   GET /api/sales
 * @desc    Get all sales with filters and pagination
 * @access  Private (requires authentication)
 */
router.get(
  '/',
  authenticate,
  validate(querySalesSchema, 'query'),
  salesController.getSales
);

/**
 * @route   GET /api/sales/:id
 * @desc    Get sale by ID with items
 * @access  Private (requires authentication)
 */
router.get(
  '/:id',
  authenticate,
  salesController.getSaleById
);

export default router;
