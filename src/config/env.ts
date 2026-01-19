import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
config();

// Define the schema for environment variables
const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  SUPABASE_URL: z.string().url({
    message: 'SUPABASE_URL must be a valid URL',
  }),
  SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'SUPABASE_ANON_KEY is required',
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: 'SUPABASE_SERVICE_ROLE_KEY is required',
  }),

  // JWT
  JWT_SECRET: z.string().min(32, {
    message: 'JWT_SECRET must be at least 32 characters long',
  }),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters long',
  }),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().min(1),
});

// Validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      console.error('❌ Invalid environment variables:');
      console.error(missingVars.join('\n'));
      console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.');

      process.exit(1);
    }
    throw error;
  }
};

// Export validated and typed environment variables
export const env = parseEnv();

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;
