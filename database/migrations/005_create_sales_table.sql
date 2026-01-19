-- Migration: Create sales table
-- Date: 2026-01-19
-- Description: Creates sales table to store sale transactions

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything (for backend API)
CREATE POLICY sales_service_role_all ON sales
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE sales IS 'Stores sale transactions';
COMMENT ON COLUMN sales.id IS 'Unique identifier for the sale';
COMMENT ON COLUMN sales.customer_id IS 'Reference to the customer who made the purchase';
COMMENT ON COLUMN sales.total IS 'Total amount of the sale';
COMMENT ON COLUMN sales.created_at IS 'Timestamp when sale was created';
COMMENT ON COLUMN sales.updated_at IS 'Timestamp when sale was last updated';
