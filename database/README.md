# Database Setup

This directory contains the database schema for the Coffee Shop Backend.

## Setup Instructions

### 1. Execute Schema in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `schema.sql`
5. Click **Run** to execute the schema

### 2. Run Migrations (if needed)

If your `users` table already exists and is missing the `refresh_token_hash` column:

1. Navigate to **SQL Editor** in Supabase
2. Copy and paste the contents of `migrations/001_add_refresh_token_hash.sql`
3. Click **Run** to execute the migration

### 3. Verify Tables

After running the schema, verify the tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see the `users` table listed.

Verify the `refresh_token_hash` column exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';
```

### 4. Test Authentication

You can now test the authentication endpoints:

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get tokens
- `GET /api/auth/me` - Get current user profile

## Schema Overview

### Users Table

Stores user accounts for coffee shop employees.

| Column              | Type      | Description                           |
| ------------------- | --------- | ------------------------------------- |
| id                  | UUID      | Unique identifier (primary key)       |
| email               | VARCHAR   | Email address (unique)                |
| password_hash       | VARCHAR   | Bcrypt hashed password                |
| first_name          | VARCHAR   | User first name                       |
| last_name           | VARCHAR   | User last name                        |
| role                | VARCHAR   | User role (admin, manager, etc.)      |
| refresh_token_hash  | TEXT      | Hashed refresh token for JWT          |
| created_at          | TIMESTAMP | When the user was created             |
| updated_at          | TIMESTAMP | When the user was last updated        |

### Indexes

- `idx_users_email` - Fast email lookups
- `idx_users_role` - Fast role filtering

### Triggers

- `update_users_updated_at` - Automatically updates `updated_at` on row changes

### Row Level Security (RLS)

- Users can read their own data
- Service role (backend) has full access
