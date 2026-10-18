-- Queries for the DBMS demo / viva.
-- Read-only statements come first. The last blocks change data and then undo it,
-- or they catch an error on purpose. Running this file does not alter the seed.

-- 1. Selection and projection: produce currently for sale in Coimbatore.
SELECT id, name, category, price, unit, stock
FROM v_catalog
WHERE status = 'Active' AND location = 'Coimbatore'
ORDER BY price;

-- 2. Inner join already baked into the catalog view (product + farmer + user).
SELECT name, "farmerName", "farmName", verified
FROM v_catalog
ORDER BY id;

-- 3. Left join: every farmer, and a message if they have one.
-- Farmers with no messages still appear, with NULL body.
SELECT u.full_name, m.body, m.sent_at
FROM farmer_profiles fp
JOIN users u ON u.user_id = fp.user_id
LEFT JOIN messages m ON m.receiver_id = fp.user_id
ORDER BY u.full_name;

-- 4. Aggregate + GROUP BY + HAVING.
-- Categories whose listed stock (including sold out) is above 100.
SELECT category,
       COUNT(*) AS listings,
       SUM(stock) AS units,
       ROUND(AVG(price), 2) AS avg_price
FROM products
GROUP BY category
HAVING SUM(stock) > 100
ORDER BY units DESC;

-- 5. Correlated subquery: listings priced above their own category average.
SELECT p.name, p.category, p.price
FROM products p
WHERE p.price > (
  SELECT AVG(p2.price) FROM products p2 WHERE p2.category = p.category
)
ORDER BY p.category, p.price DESC;

-- 6. EXISTS: buyers who have ordered fruit.
SELECT u.full_name, u.location
FROM users u
WHERE u.role = 'buyer'
  AND EXISTS (
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN products p ON p.product_id = oi.product_id
    WHERE o.buyer_id = u.user_id
      AND p.category = 'Fruit'
  );

-- 7. Window function: rank farms by revenue from completed orders.
SELECT farmer_name,
       farm_name,
       completed_revenue,
       RANK() OVER (ORDER BY completed_revenue DESC) AS revenue_rank
FROM v_farmer_metrics
ORDER BY revenue_rank, farmer_name;

-- 8. Order board (the FF- numbers on the screen) and the line that makes the total.
SELECT display_id, buyer_name, farmer_name, status, order_total
FROM v_order_board
ORDER BY created_at DESC;

SELECT display_id, product_name, quantity, unit, unit_price, line_total
FROM v_order_lines
ORDER BY order_id, product_id;

-- 9. Parameterised search (marketplace filters).
SELECT id, name, location, price
FROM search_catalog('tomato', 'Vegetables', NULL, 100);

-- 10. Status history written by the log trigger when the seed orders were inserted.
SELECT order_id, old_status, new_status, changed_at
FROM order_status_log
ORDER BY order_id;

-- 11. Transaction demo. place_order locks the product row, checks stock,
-- writes the order, and decrements stock. ROLLBACK puts the seed back.
BEGIN;
SELECT place_order(
  5,
  '142 Cross Cut Road, Gandhipuram, Coimbatore',
  '[{"productId": 6, "quantity": 10}]'::jsonb
) AS new_order_id;

SELECT product_id, name, stock, status
FROM products
WHERE product_id = 6;
ROLLBACK;

-- Stock is unchanged after the rollback.
SELECT product_id, stock FROM products WHERE product_id = 6;

-- 12. The same function refuses an illegal order. Exception is caught so this
-- file can keep going. Nothing is committed.
DO $$
BEGIN
  PERFORM place_order(5, 'should fail', '[{"productId": 5, "quantity": 5}]'::jsonb);
  RAISE EXCEPTION 'sold-out guard did not fire';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Expected refusal: %', SQLERRM;
END $$;

-- 13. A line item from another farm is rejected by the order_items trigger.
DO $$
BEGIN
  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES (1042, 2, 10, 55.00);
  RAISE EXCEPTION 'same-farmer guard did not fire';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Expected refusal: %', SQLERRM;
END $$;

-- 14. Completed -> Placed is not a legal transition.
DO $$
BEGIN
  PERFORM set_order_status(1031, 'Placed');
  RAISE EXCEPTION 'status guard did not fire';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Expected refusal: %', SQLERRM;
END $$;

-- 15. A legal step does work, and the log records it. Rolled back.
BEGIN;
SELECT set_order_status(1042, 'Confirmed') AS now_status;
SELECT order_id, old_status, new_status
FROM order_status_log
WHERE order_id = 1042
ORDER BY log_id;
ROLLBACK;
