import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import * as customersController from './customers.controller';
import { queryCustomersSchema } from './customers.schema';

const router = Router();

/**
 * @route   GET /api/customers
 * @desc    Get all customers with filters and pagination
 * @access  Private (requires authentication)
 */
router.get(
  '/',
  authenticate,
  validate(queryCustomersSchema, 'query'),
  customersController.getCustomers
);

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID with purchase history summary
 * @access  Private (requires authentication)
 */
router.get(
  '/:id',
  authenticate,
  customersController.getCustomerById
);

/**
 * @route   GET /api/customers/:id/purchases
 * @desc    Get customer purchase history with full details and pagination
 * @access  Private (requires authentication)
 */
router.get(
  '/:id/purchases',
  authenticate,
  customersController.getCustomerPurchases
);

export default router;
