import { z } from 'zod';

/**
 * Schema for creating a product
 * Note: Image is handled by multer middleware, not in this schema
 */
export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  price: z
    .coerce.number()
    .positive('Price must be positive')
    .max(1000000, 'Price must not exceed 1,000,000'),
  stock: z
    .coerce.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock must not exceed 10,000'),
});

/**
 * Schema for updating a product
 * All fields are optional
 */
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(1000000, 'Price must not exceed 1,000,000')
    .optional(),
  stock: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock must not exceed 10,000')
    .optional(),
});

/**
 * Schema for product query parameters
 */
export const queryProductsSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  search: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  inStock: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  sortBy: z
    .enum(['name', 'price', 'createdAt', 'stock'])
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type QueryProductsInput = z.infer<typeof queryProductsSchema>;
