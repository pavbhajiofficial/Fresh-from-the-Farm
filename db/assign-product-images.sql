-- Adds photos to known sample listings only. No changes to product names,
-- prices, quantities, users, or orders. Safe to run again.
-- Existing farmer-uploaded photos are preserved.
WITH image_map(product_name, image_path) AS (
  VALUES
    ('vine tomatoes', '/produce/vine-tomatoes.webp'),
    ('orange carrots', '/produce/orange-carrots.webp'),
    ('baby spinach', '/produce/baby-spinach.webp'),
    ('blueberries', '/produce/blueberries.webp'),
    ('cherry tomatoes', '/produce/cherry-tomatoes.webp'),
    ('curry leaves', '/produce/curry-leaves.webp'),
    ('demo potatoes', '/produce/potatoes.webp'),
    ('potatoes', '/produce/potatoes.webp'),
    ('fresh green beans', '/produce/fresh-green-beans.webp')
)
UPDATE public.products AS p
SET image_url = m.image_path
FROM image_map AS m
WHERE lower(btrim(p.name)) = m.product_name
  AND (
    p.image_url IS NULL
    OR btrim(p.image_url) = ''
    OR p.image_url LIKE '/produce/%'
  )
RETURNING p.product_id, p.name, p.image_url;
