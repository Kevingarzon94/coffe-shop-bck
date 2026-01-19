-- Migration: Create dashboard views
-- Date: 2026-01-19
-- Description: Creates materialized views for dashboard analytics and metrics

-- ============================================
-- View: Revenue Summary
-- ============================================
CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT
  COALESCE(COUNT(id), 0)::INTEGER AS total_sales,
  COALESCE(SUM(total), 0)::DECIMAL(10, 2) AS total_revenue,
  COALESCE(AVG(total), 0)::DECIMAL(10, 2) AS average_sale
FROM sales;

COMMENT ON VIEW v_revenue_summary IS 'Summary of total sales, revenue, and average sale amount';

-- ============================================
-- View: Top Products by Sales
-- ============================================
CREATE OR REPLACE VIEW v_top_products AS
SELECT
  p.id,
  p.name,
  p.price,
  p.stock,
  p.image_url,
  COALESCE(SUM(si.quantity), 0)::INTEGER AS total_quantity_sold,
  COALESCE(SUM(si.subtotal), 0)::DECIMAL(10, 2) AS total_revenue,
  COUNT(DISTINCT si.sale_id)::INTEGER AS times_sold
FROM products p
LEFT JOIN sale_items si ON p.id = si.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.price, p.stock, p.image_url
ORDER BY total_revenue DESC;

COMMENT ON VIEW v_top_products IS 'Products ranked by total revenue, including sales statistics';

-- ============================================
-- View: Top Customers by Spending
-- ============================================
CREATE OR REPLACE VIEW v_top_customers AS
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  COUNT(s.id)::INTEGER AS total_purchases,
  COALESCE(SUM(s.total), 0)::DECIMAL(10, 2) AS total_spent,
  COALESCE(AVG(s.total), 0)::DECIMAL(10, 2) AS average_purchase,
  MAX(s.created_at) AS last_purchase_date
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
GROUP BY c.id, c.first_name, c.last_name, c.email
ORDER BY total_spent DESC;

COMMENT ON VIEW v_top_customers IS 'Customers ranked by total spending, including purchase statistics';

-- ============================================
-- View: Low Stock Products
-- ============================================
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT
  id,
  name,
  price,
  stock,
  image_url,
  created_at,
  updated_at
FROM products
WHERE is_active = true
  AND stock < 5
ORDER BY stock ASC, name ASC;

COMMENT ON VIEW v_low_stock_products IS 'Active products with stock below 5 units, sorted by stock level';

-- ============================================
-- Grant permissions to service role
-- ============================================
GRANT SELECT ON v_revenue_summary TO service_role;
GRANT SELECT ON v_top_products TO service_role;
GRANT SELECT ON v_top_customers TO service_role;
GRANT SELECT ON v_low_stock_products TO service_role;
