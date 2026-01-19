-- Migration: Create process_sale function
-- Date: 2026-01-19
-- Description: Creates RPC function to process sales atomically

-- Type for sale items
CREATE TYPE sale_item_input AS (
  product_id UUID,
  quantity INTEGER
);

-- Function to process a sale transaction atomically
CREATE OR REPLACE FUNCTION process_sale(
  p_customer_first_name VARCHAR,
  p_customer_last_name VARCHAR,
  p_customer_email VARCHAR,
  p_items sale_item_input[]
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_id UUID;
  v_sale_id UUID;
  v_total DECIMAL(10, 2) := 0;
  v_item sale_item_input;
  v_product RECORD;
  v_subtotal DECIMAL(10, 2);
BEGIN
  -- 1. Find or create customer
  SELECT id INTO v_customer_id
  FROM customers
  WHERE email = p_customer_email;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (first_name, last_name, email)
    VALUES (p_customer_first_name, p_customer_last_name, p_customer_email)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update customer name if changed
    UPDATE customers
    SET first_name = p_customer_first_name,
        last_name = p_customer_last_name,
        updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  -- 2. Validate all products and check stock
  FOREACH v_item IN ARRAY p_items
  LOOP
    SELECT id, name, price, stock, is_active
    INTO v_product
    FROM products
    WHERE id = v_item.product_id;

    -- Check if product exists
    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Product not found: ' || v_item.product_id
      );
    END IF;

    -- Check if product is active
    IF NOT v_product.is_active THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Product is not active: ' || v_product.name
      );
    END IF;

    -- Check if enough stock
    IF v_product.stock < v_item.quantity THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Insufficient stock for product: ' || v_product.name ||
                   ' (available: ' || v_product.stock || ', requested: ' || v_item.quantity || ')'
      );
    END IF;
  END LOOP;

  -- 3. Create sale
  INSERT INTO sales (customer_id, total)
  VALUES (v_customer_id, 0)
  RETURNING id INTO v_sale_id;

  -- 4. Process each item
  FOREACH v_item IN ARRAY p_items
  LOOP
    -- Get product details
    SELECT price INTO v_product
    FROM products
    WHERE id = v_item.product_id;

    -- Calculate subtotal
    v_subtotal := v_product.price * v_item.quantity;
    v_total := v_total + v_subtotal;

    -- Insert sale item
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_sale_id, v_item.product_id, v_item.quantity, v_product.price, v_subtotal);

    -- Update product stock
    UPDATE products
    SET stock = stock - v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.product_id;
  END LOOP;

  -- 5. Update sale total
  UPDATE sales
  SET total = v_total
  WHERE id = v_sale_id;

  -- 6. Return success
  RETURN json_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'customer_id', v_customer_id,
    'total', v_total
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Transaction failed: ' || SQLERRM
    );
END;
$$;

-- Comment on function
COMMENT ON FUNCTION process_sale IS 'Processes a sale transaction atomically, validating stock and updating all related tables';
