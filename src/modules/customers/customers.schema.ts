import { z } from 'zod';

/**
 * Schema for customer query parameters
 */
export const queryCustomersSchema = z.object({
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
  search: z
    .string()
    .optional(),
  sortBy: z
    .enum(['firstName', 'lastName', 'totalPurchases', 'totalSpent', 'createdAt'])
    .optional()
    .default('totalSpent'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// Type exports
export type QueryCustomersInput = z.infer<typeof queryCustomersSchema>;
