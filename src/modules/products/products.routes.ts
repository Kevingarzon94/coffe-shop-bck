import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import * as productsController from './products.controller';
import { upload } from './products.controller';
import {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
} from './products.schema';

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filters and pagination
 * @access  Public
 */
router.get(
  '/',
  validate(queryProductsSchema, 'query'),
  productsController.getProducts
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
  '/:id',
  productsController.getProductById
);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (requires authentication)
 */
router.post(
  '/',
  authenticate,
  upload.single('image'),
  validate(createProductSchema),
  productsController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (requires authentication)
 */
router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  validate(updateProductSchema),
  productsController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (soft delete)
 * @access  Private (requires authentication)
 */
router.delete(
  '/:id',
  authenticate,
  productsController.deleteProduct
);

export default router;
