import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase client with service role key for backend operations.
 * This client has full access to the database, bypassing Row Level Security (RLS).
 * Use with caution and ensure proper authorization checks in your API endpoints.
 */
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase client with anon key for public operations.
 * This client respects Row Level Security (RLS) policies.
 * Useful for operations that should respect RLS.
 */
export const supabaseAnon = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
