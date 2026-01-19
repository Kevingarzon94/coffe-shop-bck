-- Migration: Create sale_items table
-- Date: 2026-01-19
-- Description: Creates sale_items table to store individual items in each sale

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Enable RLS
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything (for backend API)
CREATE POLICY sale_items_service_role_all ON sale_items
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE sale_items IS 'Stores individual items in each sale';
COMMENT ON COLUMN sale_items.id IS 'Unique identifier for the sale item';
COMMENT ON COLUMN sale_items.sale_id IS 'Reference to the sale';
COMMENT ON COLUMN sale_items.product_id IS 'Reference to the product';
COMMENT ON COLUMN sale_items.quantity IS 'Quantity of the product sold';
COMMENT ON COLUMN sale_items.unit_price IS 'Price per unit at the time of sale';
COMMENT ON COLUMN sale_items.subtotal IS 'Total for this line item (quantity * unit_price)';
COMMENT ON COLUMN sale_items.created_at IS 'Timestamp when sale item was created';
