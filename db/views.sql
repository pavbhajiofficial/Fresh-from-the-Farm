-- Views the screens need. Column names match lib/types.ts
-- so a later API can SELECT from the view instead of repeating the joins.

BEGIN;

-- Buyer catalog. One row per listing, with the farm joined on.
CREATE OR REPLACE VIEW v_catalog AS
SELECT
  p.product_id                         AS id,
  p.name,
  p.category,
  p.grade,
  COALESCE(p.description, '')          AS description,
  p.price,
  p.unit,
  p.stock,
  p.min_order                          AS "minOrder",
  to_char(p.harvest_date, 'YYYY-MM-DD') AS "harvestDate",
  p.location,
  p.fulfilment,
  u.full_name                          AS "farmerName",
  fp.farm_name                         AS "farmName",
  fp.verified,
  p.image_url                          AS "imageUrl",
  p.status
FROM products p
JOIN farmer_profiles fp ON fp.user_id = p.farmer_id
JOIN users u ON u.user_id = fp.user_id;

-- Order list used by the buyer history and the farmer queue.
-- display_id is the FF-1042 style id the frontend already shows.
CREATE OR REPLACE VIEW v_order_board AS
SELECT
  o.order_id,
  'FF-' || o.order_id                    AS display_id,
  o.buyer_id,
  buyer.full_name                        AS buyer_name,
  o.farmer_id,
  farmer.full_name                       AS farmer_name,
  fp.farm_name,
  o.status,
  o.address,
  o.created_at,
  COUNT(oi.product_id)                   AS line_count,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS order_total
FROM orders o
JOIN users buyer ON buyer.user_id = o.buyer_id
JOIN farmer_profiles fp ON fp.user_id = o.farmer_id
JOIN users farmer ON farmer.user_id = fp.user_id
LEFT JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY
  o.order_id, buyer.full_name, farmer.full_name, fp.farm_name;

-- Farmer home page numbers.
-- Subqueries, not one big join: joining products to orders would
-- multiply stock and revenue.
CREATE OR REPLACE VIEW v_farmer_metrics AS
SELECT
  fp.user_id AS farmer_id,
  u.full_name AS farmer_name,
  fp.farm_name,
  fp.verified,
  (
    SELECT COUNT(*)
    FROM products p
    WHERE p.farmer_id = fp.user_id AND p.status = 'Active'
  ) AS active_listings,
  (
    SELECT COALESCE(SUM(p.stock), 0)
    FROM products p
    WHERE p.farmer_id = fp.user_id AND p.status = 'Active'
  ) AS units_on_hand,
  (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.farmer_id = fp.user_id
      AND o.status IN ('Placed', 'Confirmed', 'Preparing', 'Ready')
  ) AS open_orders,
  (
    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.farmer_id = fp.user_id AND o.status = 'Completed'
  ) AS completed_revenue
FROM farmer_profiles fp
JOIN users u ON u.user_id = fp.user_id;

-- Line detail behind an order card.
CREATE OR REPLACE VIEW v_order_lines AS
SELECT
  o.order_id,
  'FF-' || o.order_id AS display_id,
  oi.product_id,
  p.name AS product_name,
  p.unit,
  oi.quantity,
  oi.unit_price,
  oi.quantity * oi.unit_price AS line_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id;

-- Optional filter used by the marketplace search box.
-- % and _ typed by the user are matched literally, not treated as wildcards.
CREATE OR REPLACE FUNCTION search_catalog(
  p_query     TEXT DEFAULT NULL,
  p_category  TEXT DEFAULT NULL,
  p_location  TEXT DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL
)
RETURNS SETOF v_catalog
LANGUAGE sql
STABLE
AS $$
  WITH pattern AS (
    SELECT CASE
      WHEN p_query IS NULL OR btrim(p_query) = '' THEN NULL
      ELSE '%' || replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
    END AS value
  )
  SELECT c.*
  FROM v_catalog c
  CROSS JOIN pattern
  WHERE (p_category IS NULL OR c.category = p_category)
    AND (p_location IS NULL OR c.location = p_location)
    AND (p_max_price IS NULL OR c.price <= p_max_price)
    AND (
      pattern.value IS NULL
      OR c.name ILIKE pattern.value ESCAPE '\'
      OR c.description ILIKE pattern.value ESCAPE '\'
      OR c."farmName" ILIKE pattern.value ESCAPE '\'
    )
  ORDER BY c.id;
$$;

COMMIT;
