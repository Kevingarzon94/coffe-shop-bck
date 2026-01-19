import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './shared/middleware/error.middleware';
import { successResponse } from './shared/utils/response';

// ==================== Rate Limiters ====================
// General rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth rate limiter: 5 requests per 15 minutes (can be used in auth routes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
          // Module routes will be added here
        },
      })
    );
  });

  // TODO: Add module routes here
  // app.use('/api/auth', authRoutes);
  // app.use('/api/products', productRoutes);
  // app.use('/api/sales', salesRoutes);
  // app.use('/api/customers', customerRoutes);
  // app.use('/api/dashboard', dashboardRoutes);

  // ==================== Error Handling ====================
  // Handle 404 - Route not found
  app.use(notFoundMiddleware);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
