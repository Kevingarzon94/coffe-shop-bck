import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './shared/middleware/error.middleware';
import { generalLimiter } from './shared/middleware/rate-limit.middleware';
import { successResponse } from './shared/utils/response';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import salesRoutes from './modules/sales/sales.routes';
import customersRoutes from './modules/customers/customers.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // ==================== Security Middlewares ====================
  // Set security-related HTTP headers
  app.use(helmet());

  // Enable CORS with configured origin
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // ==================== Parsing Middlewares ====================
  // Parse JSON request bodies (limit: 10mb)
  app.use(express.json({ limit: '10mb' }));

  // Parse URL-encoded request bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ==================== Logging ====================
  // HTTP request logger (only in development)
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // ==================== Rate Limiting ====================

  // Apply general rate limiter to all routes
  app.use(generalLimiter);

  // ==================== Health Check ====================
  app.get('/health', (req: Request, res: Response) => {
    res.json(
      successResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      })
    );
  });

  // ==================== API Routes ====================
  // API root endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json(
      successResponse({
        message: 'Coffee Shop API v1.0',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api',
          auth: '/api/auth',
          products: '/api/products',
          sales: '/api/sales',
          customers: '/api/customers',
          dashboard: '/api/dashboard',
        },
      })
    );
  });

  // ==================== Module Routes ====================
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // ==================== Error Handling ====================
  // Handle 404 - Route not found
  app.use(notFoundMiddleware);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
