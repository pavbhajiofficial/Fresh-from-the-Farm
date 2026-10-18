-- Sample rows that match the produce and orders already shown in the frontend.
-- password_hash is a placeholder. Login is not this module's job.
-- Run schema.sql, triggers.sql, functions.sql and views.sql before this file.

BEGIN;

INSERT INTO users (user_id, full_name, email, phone, password_hash, role, location) VALUES
  (1, 'Meena Devi',       'meena@kaveri.example',      '+919876543210', 'demo-not-a-real-hash', 'farmer', 'Coimbatore'),
  (2, 'Rajan K',          'rajan@hilltop.example',     '+919876543211', 'demo-not-a-real-hash', 'farmer', 'Ooty'),
  (3, 'Lakshmi S',        'lakshmi@greenloop.example', '+919876543212', 'demo-not-a-real-hash', 'farmer', 'Chennai'),
  (4, 'Anand P',          'anand@mistvalley.example',  '+919876543213', 'demo-not-a-real-hash', 'farmer', 'Kodaikanal'),
  (5, 'Sri Retail Mart',  'procure@srimart.example',   '+919876543220', 'demo-not-a-real-hash', 'buyer',  'Coimbatore'),
  (6, 'Green Plate Cafe', 'chef@greenplate.example',   '+919876543221', 'demo-not-a-real-hash', 'buyer',  'Chennai'),
  (7, 'Nila Foods',       'orders@nilafoods.example',  '+919876543222', 'demo-not-a-real-hash', 'buyer',  'Madurai')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO farmer_profiles (user_id, farm_name, verified) VALUES
  (1, 'Kaveri Acres', true),
  (2, 'Hilltop Roots', true),
  (3, 'Green Loop Farm', false),
  (4, 'Mist Valley Berries', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO products (
  product_id, farmer_id, name, category, grade, description,
  price, unit, stock, min_order, harvest_date, location, fulfilment, status
) VALUES
  (1, 1, 'Vine Tomatoes',   'Vegetables', 'Grade A',  'Sun-ripened tomatoes picked at dawn. Firm and deep red.', 42.00,  'kg',    800, 20, '2026-10-15', 'Coimbatore', 'Delivery or pickup', 'Active'),
  (2, 2, 'Orange Carrots',  'Vegetables', 'Grade A',  'Sweet, crunchy hill-grown carrots.',                       55.00,  'kg',    420, 10, '2026-10-15', 'Ooty',       'Delivery or pickup', 'Active'),
  (3, 3, 'Baby Spinach',    'Greens',     'Organic',  'Tender leaves, grown without synthetic pesticides.',       30.00,  'bunch', 150,  5, '2026-10-15', 'Chennai',    'Delivery or pickup', 'Active'),
  (4, 4, 'Blueberries',     'Fruit',      'Premium',  'Plump, sweet cool-climate berries in 500 g punnets.',     380.00,  'kg',     60,  2, '2026-10-15', 'Kodaikanal', 'Delivery or pickup', 'Active'),
  (5, 3, 'Cherry Tomatoes', 'Vegetables', 'Grade A',  'Bite-sized and juicy. Next harvest soon.',                 90.00,  'kg',      0,  5, '2026-10-15', 'Chennai',    'Delivery or pickup', 'Sold Out'),
  (6, 1, 'Curry Leaves',    'Greens',     'Fresh',    'Fragrant leaves cut the same morning.',                    20.00,  'bunch', 300, 10, '2026-10-15', 'Coimbatore', 'Delivery or pickup', 'Active')
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO orders (order_id, buyer_id, farmer_id, status, address, created_at) VALUES
  (1042, 5, 1, 'Placed',    '142 Cross Cut Road, Gandhipuram, Coimbatore', '2026-10-16 10:30:00+05:30'),
  (1039, 6, 2, 'Confirmed', '88 Cathedral Road, Gopalapuram, Chennai',      '2026-10-15 14:15:00+05:30'),
  (1031, 7, 4, 'Completed', '12 West Masi Street, Madurai',                  '2026-10-12 09:00:00+05:30')
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1042, 1, 100, 42.00),
  (1039, 2,  30, 55.00),
  (1031, 4,   8, 380.00)
ON CONFLICT (order_id, product_id) DO NOTHING;

INSERT INTO reviews (order_id, rating, comment) VALUES
  (1031, 5, 'Exquisite cool-climate berries. Delivered intact with zero bruising.')
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO favourites (user_id, product_id) VALUES
  (5, 1),
  (6, 4)
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO messages (message_id, sender_id, receiver_id, product_id, order_id, body) VALUES
  (1, 5, 1, 1, 1042, 'Please pack the tomatoes in 10 kg crates.')
ON CONFLICT (message_id) DO NOTHING;

-- Explicit ids do not move a sequence. Point each sequence past the rows we inserted.
SELECT setval(pg_get_serial_sequence('users', 'user_id'),         (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('products', 'product_id'),   (SELECT MAX(product_id) FROM products));
SELECT setval(pg_get_serial_sequence('orders', 'order_id'),       (SELECT MAX(order_id) FROM orders));
SELECT setval(pg_get_serial_sequence('messages', 'message_id'),   (SELECT MAX(message_id) FROM messages));

COMMIT;
