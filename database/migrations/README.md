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

### 4. Create customers table
**File:** `004_create_customers_table.sql`

Creates the customers table with:
- Customer information (first_name, last_name, email)
- Unique email constraint
- Automatic timestamps (created_at, updated_at)
- Indexes for email and name lookups
- RLS policies

### 5. Create sales table
**File:** `005_create_sales_table.sql`

Creates the sales table with:
- Foreign key to customers
- Total amount for the sale
- Automatic timestamps
- Indexes for customer_id and created_at
- RLS policies

### 6. Create sale_items table
**File:** `006_create_sale_items_table.sql`

Creates the sale_items table with:
- Foreign keys to sales and products
- Quantity, unit price, and subtotal
- Cascading delete from sales
- Indexes for sale_id and product_id
- RLS policies

### 7. Create process_sale RPC function
**File:** `007_create_process_sale_function.sql`

Creates the atomic transaction function for processing sales:
- Custom type `sale_item_input` for sale items
- Validates products exist and are active
- Checks sufficient stock availability
- Creates or updates customer records
- Creates sale and sale items atomically
- Updates product stock automatically
- Comprehensive error handling
- Returns detailed result with sale_id, customer_id, and total

## How to Execute

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from each migration file (in order)
5. Click **Run** to execute

## Verify Installation

After running all migrations, verify with:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'products', 'customers', 'sales', 'sale_items')
ORDER BY table_name;

-- Check storage bucket exists
SELECT *
FROM storage.buckets
WHERE id = 'product-images';

-- Check process_sale function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'process_sale';

-- Check sale_item_input type exists
SELECT typname
FROM pg_type
WHERE typname = 'sale_item_input';
```

## Rollback (if needed)

To remove all tables and resources (in reverse order):

```sql
-- Drop process_sale function
DROP FUNCTION IF EXISTS process_sale CASCADE;

-- Drop custom type
DROP TYPE IF EXISTS sale_item_input CASCADE;

-- Drop sales-related tables (in order due to foreign keys)
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Drop products table
DROP TABLE IF EXISTS products CASCADE;

-- Remove storage bucket (this will delete all images!)
DELETE FROM storage.buckets WHERE id = 'product-images';

-- Drop users table (if needed)
-- DROP TABLE IF EXISTS users CASCADE;
```

**⚠️ Warning:** Dropping tables, functions, or buckets will permanently delete all data!

## Test the Setup

After running all migrations, you can test the process_sale function:

```sql
-- First, create a test product
INSERT INTO products (name, description, price, stock, is_active)
VALUES ('Test Coffee', 'Delicious test coffee', 25.50, 100, true)
RETURNING id;

-- Then test the sale (replace <product-id> with the ID from above)
SELECT process_sale(
  'John',
  'Doe',
  'john@example.com',
  ARRAY[
    ROW('<product-id>', 2)::sale_item_input
  ]::sale_item_input[]
);

-- Check the results
SELECT * FROM customers WHERE email = 'john@example.com';
SELECT * FROM sales ORDER BY created_at DESC LIMIT 1;
SELECT * FROM sale_items ORDER BY created_at DESC LIMIT 5;
SELECT stock FROM products WHERE name = 'Test Coffee';
```
