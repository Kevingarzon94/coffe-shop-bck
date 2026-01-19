-- Migration: Create products table
-- Date: 2026-01-19
-- Description: Creates products table with image storage support

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active products
CREATE POLICY products_select_active ON products
  FOR SELECT
  USING (is_active = true);

-- Policy: Service role can do anything (for backend API)
CREATE POLICY products_service_role_all ON products
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE products IS 'Stores coffee shop products';
COMMENT ON COLUMN products.id IS 'Unique identifier for the product';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.description IS 'Product description';
COMMENT ON COLUMN products.price IS 'Product price in local currency';
COMMENT ON COLUMN products.stock IS 'Available stock quantity';
COMMENT ON COLUMN products.image_url IS 'URL to product image in Supabase Storage';
COMMENT ON COLUMN products.is_active IS 'Soft delete flag';
COMMENT ON COLUMN products.created_at IS 'Timestamp when product was created';
COMMENT ON COLUMN products.updated_at IS 'Timestamp when product was last updated';
