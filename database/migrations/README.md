# Database Migrations

Execute these migrations in order in your Supabase SQL Editor.

## Migration Order

### 1. Add refresh_token_hash column (if needed)
**File:** `001_add_refresh_token_hash.sql`

Run this if your users table doesn't have the `refresh_token_hash` column.

### 2. Create products table
**File:** `002_create_products_table.sql`

Creates the products table with:
- Basic product information (name, description, price, stock)
- Image URL for product images
- Soft delete support (is_active)
- Automatic timestamps (created_at, updated_at)
- Indexes for performance
- RLS policies

### 3. Create storage bucket for product images
**File:** `003_create_storage_bucket.sql`

Creates and configures the `product-images` storage bucket with:
- Public access for reading images
- 5MB file size limit
- Allowed mime types: JPEG, PNG, WebP
- Service role permissions for upload/update/delete

## How to Execute

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from each migration file (in order)
5. Click **Run** to execute

## Verify Installation

After running all migrations, verify with:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'products');

-- Check storage bucket exists
SELECT *
FROM storage.buckets
WHERE id = 'product-images';

-- Check products table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

## Rollback (if needed)

To remove the products table and bucket:

```sql
-- Drop products table
DROP TABLE IF EXISTS products CASCADE;

-- Remove storage bucket (this will delete all images!)
DELETE FROM storage.buckets WHERE id = 'product-images';
```

**⚠️ Warning:** Dropping tables or buckets will permanently delete all data!
