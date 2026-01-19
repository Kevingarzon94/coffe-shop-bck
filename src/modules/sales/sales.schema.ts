import { z } from 'zod';

/**
 * Schema for a single sale item
 */
export const saleItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z
    .coerce.number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(100, 'Quantity cannot exceed 100 per item'),
});

/**
 * Schema for creating a sale
 */
export const createSaleSchema = z.object({
  customer: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters'),
    email: z.string().email('Invalid email format'),
  }),
  items: z
    .array(saleItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Cannot exceed 50 items per sale'),
});

/**
 * Schema for sale query parameters
 */
export const querySalesSchema = z.object({
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
  from: z
    .string()
    .datetime()
    .optional(),
  to: z
    .string()
    .datetime()
    .optional(),
  customerId: z
    .string()
    .uuid('Invalid customer ID')
    .optional(),
});

// Type exports
export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type QuerySalesInput = z.infer<typeof querySalesSchema>;
