-- Optional. Run as a superuser after install.sql.
-- The frontend does not log in as these roles yet. They show, for the viva,
-- that a buyer is not granted an update on products or orders.
-- Stock changes go through place_order(), which is the only write a buyer gets.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ff_buyer') THEN
    CREATE ROLE ff_buyer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ff_farmer') THEN
    CREATE ROLE ff_farmer NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO ff_buyer, ff_farmer;

GRANT SELECT ON v_catalog, v_order_board, v_order_lines, v_farmer_metrics TO ff_buyer, ff_farmer;
GRANT SELECT ON products, orders, order_items, farmer_profiles, reviews TO ff_buyer, ff_farmer;

GRANT INSERT, DELETE ON favourites TO ff_buyer;
GRANT INSERT ON messages TO ff_buyer, ff_farmer;
GRANT UPDATE (read_at) ON messages TO ff_buyer, ff_farmer;

GRANT EXECUTE ON FUNCTION place_order(INT, TEXT, JSONB) TO ff_buyer;
GRANT EXECUTE ON FUNCTION search_catalog(TEXT, TEXT, TEXT, NUMERIC) TO ff_buyer, ff_farmer;
GRANT EXECUTE ON FUNCTION set_order_status(INT, order_status) TO ff_farmer;

-- Farmers maintain their own listings. A real deployment would also restrict
-- rows with row-level security; table privileges are the first cut.
GRANT INSERT, UPDATE, DELETE ON products TO ff_farmer;
GRANT USAGE, SELECT ON SEQUENCE products_product_id_seq TO ff_farmer;
