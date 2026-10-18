-- Drops everything this module creates. Irreversible.
-- psql -d fresh_farm -f db/reset.sql && psql -d fresh_farm -f db/install.sql

BEGIN;

DROP VIEW IF EXISTS v_order_lines, v_farmer_metrics, v_order_board, v_catalog CASCADE;

DROP FUNCTION IF EXISTS search_catalog(TEXT, TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS set_order_status(INT, order_status);
DROP FUNCTION IF EXISTS place_order(INT, TEXT, JSONB);
DROP FUNCTION IF EXISTS trg_review_completed_order();
DROP FUNCTION IF EXISTS trg_log_order_status();
DROP FUNCTION IF EXISTS trg_order_status_transition();
DROP FUNCTION IF EXISTS trg_order_item_rules();
DROP FUNCTION IF EXISTS trg_sync_product_status();
DROP FUNCTION IF EXISTS trg_farmer_profile_role();

DROP TABLE IF EXISTS
  order_status_log,
  reviews,
  messages,
  favourites,
  order_items,
  orders,
  products,
  farmer_profiles,
  users
CASCADE;

DROP TYPE IF EXISTS order_status, product_status, user_role CASCADE;

COMMIT;
