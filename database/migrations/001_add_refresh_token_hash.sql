-- Migration: Add refresh_token_hash column to users table
-- Date: 2026-01-19
-- Description: Adds refresh_token_hash column for JWT refresh token functionality

-- Add refresh_token_hash column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'refresh_token_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN refresh_token_hash TEXT;
    RAISE NOTICE 'Column refresh_token_hash added to users table';
  ELSE
    RAISE NOTICE 'Column refresh_token_hash already exists';
  END IF;
END$$;
