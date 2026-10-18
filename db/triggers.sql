-- Triggers. These run for every insert/update, including raw SQL,
-- so the rules still hold if somebody bypasses place_order().

BEGIN;

-- Only a user whose role is farmer may own a farm profile.
CREATE OR REPLACE FUNCTION trg_farmer_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM users WHERE user_id = NEW.user_id;
  IF v_role IS DISTINCT FROM 'farmer' THEN
    RAISE EXCEPTION 'User % is not a farmer and cannot own farm profile', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER farmer_profiles_role
BEFORE INSERT OR UPDATE OF user_id ON farmer_profiles
FOR EACH ROW EXECUTE FUNCTION trg_farmer_profile_role();

-- Keep status and stock from disagreeing.
-- Draft + zero stock stays Draft (not yet offered). Active + zero becomes Sold Out.
CREATE OR REPLACE FUNCTION trg_sync_product_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stock = 0 AND NEW.status = 'Active' THEN
    NEW.status := 'Sold Out';
  ELSIF NEW.stock > 0 AND NEW.status = 'Sold Out' THEN
    NEW.status := 'Active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_sync_status
BEFORE INSERT OR UPDATE OF stock, status ON products
FOR EACH ROW EXECUTE FUNCTION trg_sync_product_status();

-- Every line must belong to the order's farmer and meet the listing minimum.
CREATE OR REPLACE FUNCTION trg_order_item_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_farmer  INT;
  v_product_farmer INT;
  v_min           NUMERIC(10,2);
  v_name          TEXT;
BEGIN
  SELECT farmer_id INTO v_order_farmer FROM orders WHERE order_id = NEW.order_id;
  SELECT farmer_id, min_order, name
    INTO v_product_farmer, v_min, v_name
  FROM products
  WHERE product_id = NEW.product_id;

  IF v_product_farmer IS NULL THEN
    RAISE EXCEPTION 'Product % does not exist', NEW.product_id;
  END IF;
  IF v_order_farmer IS DISTINCT FROM v_product_farmer THEN
    RAISE EXCEPTION
      'Order % belongs to farmer %, but % belongs to farmer %',
      NEW.order_id, v_order_farmer, v_name, v_product_farmer;
  END IF;
  IF NEW.quantity < v_min THEN
    RAISE EXCEPTION 'Minimum order for % is %', v_name, v_min;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER order_items_rules
BEFORE INSERT OR UPDATE OF order_id, product_id, quantity ON order_items
FOR EACH ROW EXECUTE FUNCTION trg_order_item_rules();

-- Live status changes must follow the pipeline.
-- Inserts are not checked, so seed.sql can load orders that are already
-- Confirmed or Completed.
CREATE OR REPLACE FUNCTION trg_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
       (OLD.status = 'Placed'    AND NEW.status IN ('Confirmed', 'Rejected'))
    OR (OLD.status = 'Confirmed' AND NEW.status IN ('Preparing', 'Rejected'))
    OR (OLD.status = 'Preparing' AND NEW.status IN ('Ready', 'Rejected'))
    OR (OLD.status = 'Ready'     AND NEW.status = 'Completed')
  ) THEN
    RAISE EXCEPTION 'Cannot move order % from % to %', NEW.order_id, OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_status_transition
BEFORE UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION trg_order_status_transition();

CREATE OR REPLACE FUNCTION trg_log_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_log (order_id, old_status, new_status)
    VALUES (
      NEW.order_id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_status_log
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION trg_log_order_status();

-- A review is feedback on a fulfilled order, not on a rejected or open one.
CREATE OR REPLACE FUNCTION trg_review_completed_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status order_status;
BEGIN
  SELECT status INTO v_status FROM orders WHERE order_id = NEW.order_id;
  IF v_status IS DISTINCT FROM 'Completed' THEN
    RAISE EXCEPTION 'Order % is %; reviews are allowed only after completion', NEW.order_id, v_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_completed_only
BEFORE INSERT OR UPDATE OF order_id ON reviews
FOR EACH ROW EXECUTE FUNCTION trg_review_completed_order();

COMMIT;
