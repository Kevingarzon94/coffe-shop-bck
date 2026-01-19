import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Type for the source of data to validate
 */
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Middleware factory for validating request data using Zod schemas
 *
 * @param schema - Zod schema to validate against
 * @param source - Source of data to validate ('body', 'query', or 'params')
 * @returns Express middleware function
 *
 * @example
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 *
 * router.post('/login', validate(loginSchema), loginController);
 */
export function validate(
  schema: ZodSchema,
  source: ValidationSource = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get data from the specified source
      const dataToValidate = req[source];

      // Validate and parse the data
      const validatedData = schema.parse(dataToValidate);

      // Replace the original data with validated and parsed data
      req[source] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a more readable structure
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        const validationError = AppError.validation(
          `Validation failed for ${source}`,
          details
        );

        next(validationError);
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validates multiple sources at once
 *
 * @example
 * const schemas = {
 *   body: createUserSchema,
 *   query: paginationSchema
 * };
 *
 * router.post('/users', validateMultiple(schemas), createUserController);
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: any[] = [];

      // Validate each source if schema is provided
      if (schemas.body) {
        try {
          req.body = schemas.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map((e) => ({ ...e, source: 'body' })));
          }
        }
      }

      if (schemas.query) {
        try {
          req.query = schemas.query.parse(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map((e) => ({ ...e, source: 'query' })));
          }
        }
      }

      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map((e) => ({ ...e, source: 'params' })));
          }
        }
      }

      // If there are any validation errors, throw them
      if (errors.length > 0) {
        const details = errors.map((err) => ({
          source: err.source,
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        const validationError = AppError.validation(
          'Validation failed',
          details
        );

        next(validationError);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
