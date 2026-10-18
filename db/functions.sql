-- Stored procedures used by an order. Stock is checked and reduced here,
-- inside one transaction, with SELECT ... FOR UPDATE so two buyers cannot
-- take the last crate at the same time.

BEGIN;

CREATE OR REPLACE FUNCTION place_order(
  p_buyer_id INT,
  p_address  TEXT,
  p_items    JSONB
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_role         user_role;
  v_lines        JSONB;
  v_product_id   INT;
  v_qty          NUMERIC(10,2);
  v_stock        NUMERIC(10,2);
  v_min          NUMERIC(10,2);
  v_price        NUMERIC(10,2);
  v_farmer       INT;
  v_order_farmer INT;
  v_status       product_status;
  v_name         TEXT;
  v_order_id     INT;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  SELECT role INTO v_role FROM users WHERE user_id = p_buyer_id;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Buyer % does not exist', p_buyer_id;
  END IF;
  IF v_role <> 'buyer' THEN
    RAISE EXCEPTION 'User % is a %, not a buyer', p_buyer_id, v_role;
  END IF;

  -- Collapse the cart once. Repeated lines for the same product are summed.
  -- Both product_id and productId are accepted.
  SELECT jsonb_agg(
           jsonb_build_object('product_id', product_id, 'quantity', quantity)
           ORDER BY product_id
         )
    INTO v_lines
  FROM (
    SELECT
      COALESCE(
        NULLIF(e->>'product_id', '')::INT,
        NULLIF(e->>'productId', '')::INT
      ) AS product_id,
      SUM((e->>'quantity')::NUMERIC) AS quantity
    FROM jsonb_array_elements(p_items) AS e
    GROUP BY 1
  ) AS lines;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_lines) AS e
    WHERE (e->>'product_id') IS NULL
       OR (e->>'quantity')::NUMERIC IS NULL
       OR (e->>'quantity')::NUMERIC <= 0
  ) THEN
    RAISE EXCEPTION 'Each item needs a product id and a positive quantity';
  END IF;

  -- Lock every listed product, lowest id first, before changing anything.
  -- Same lock order in every session avoids a deadlock.
  PERFORM 1
  FROM products
  WHERE product_id IN (
    SELECT (e->>'product_id')::INT
    FROM jsonb_array_elements(v_lines) AS e
  )
  ORDER BY product_id
  FOR UPDATE;

  v_order_farmer := NULL;

  FOR v_product_id, v_qty IN
    SELECT (e->>'product_id')::INT, (e->>'quantity')::NUMERIC
    FROM jsonb_array_elements(v_lines) AS e
    ORDER BY 1
  LOOP
    SELECT stock, min_order, price, farmer_id, status, name
      INTO v_stock, v_min, v_price, v_farmer, v_status, v_name
    FROM products
    WHERE product_id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % does not exist', v_product_id;
    END IF;
    IF v_status <> 'Active' THEN
      RAISE EXCEPTION 'Product % (%) is not for sale', v_name, v_status;
    END IF;
    IF v_qty < v_min THEN
      RAISE EXCEPTION 'Product % requires a minimum order of %', v_name, v_min;
    END IF;
    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, requested: %', v_name, v_stock, v_qty;
    END IF;

    IF v_order_farmer IS NULL THEN
      v_order_farmer := v_farmer;
    ELSIF v_order_farmer <> v_farmer THEN
      RAISE EXCEPTION 'One order can contain produce from only one farmer. Split the cart.';
    END IF;
  END LOOP;

  INSERT INTO orders (buyer_id, farmer_id, status, address)
  VALUES (p_buyer_id, v_order_farmer, 'Placed', NULLIF(btrim(COALESCE(p_address, '')), ''))
  RETURNING order_id INTO v_order_id;

  FOR v_product_id, v_qty IN
    SELECT (e->>'product_id')::INT, (e->>'quantity')::NUMERIC
    FROM jsonb_array_elements(v_lines) AS e
    ORDER BY 1
  LOOP
    SELECT price INTO v_price FROM products WHERE product_id = v_product_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, v_product_id, v_qty, v_price);

    -- The stock trigger flips Active -> Sold Out when the row hits zero.
    UPDATE products
    SET stock = stock - v_qty
    WHERE product_id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Farmer portal: move an order along the pipeline.
-- The transition trigger rejects illegal jumps such as Completed -> Placed.
CREATE OR REPLACE FUNCTION set_order_status(
  p_order_id INT,
  p_status   order_status
) RETURNS order_status
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM 1
  FROM orders
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist', p_order_id;
  END IF;

  UPDATE orders
  SET status = p_status
  WHERE order_id = p_order_id;

  RETURN p_status;
END;
$$;

COMMIT;
