-- Fresh from the Farm — DBMS schema (PostgreSQL)
-- Owner: database teammate. Do not rename tables or columns.
-- lib/types.ts and the screens already assume these names.
--
-- Re-run safely by dropping the database, or run reset.sql first.
-- Load order is install.sql.

BEGIN;

CREATE TYPE user_role      AS ENUM ('farmer', 'buyer');
CREATE TYPE product_status AS ENUM ('Active', 'Draft', 'Sold Out');
CREATE TYPE order_status   AS ENUM ('Placed', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Rejected');

-- A person on the platform. Farmers and buyers share this table;
-- farm-only facts live in farmer_profiles so buyer rows do not carry empty farm columns.
CREATE TABLE users (
  user_id       SERIAL PRIMARY KEY,
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL,
  location      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX users_role_idx ON users (role);

-- 1:1 with a farmer user. The primary key is also the foreign key,
-- so a person cannot own two farm profiles and a profile cannot exist without a user.
CREATE TABLE farmer_profiles (
  user_id   INT PRIMARY KEY REFERENCES users (user_id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  verified  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE products (
  product_id    SERIAL PRIMARY KEY,
  farmer_id     INT NOT NULL REFERENCES farmer_profiles (user_id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('Vegetables', 'Fruit', 'Greens')),
  grade         TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price > 0),
  unit          TEXT NOT NULL,
  stock         NUMERIC(10,2) NOT NULL CHECK (stock >= 0),
  min_order     NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (min_order > 0),
  harvest_date  DATE,
  location      TEXT NOT NULL,
  fulfilment    TEXT NOT NULL DEFAULT 'Delivery or pickup',
  image_url     TEXT,
  status        product_status NOT NULL DEFAULT 'Draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketplace filters. The partial index covers the common "what is for sale" query.
CREATE INDEX products_search ON products (status, category, location, price);
CREATE INDEX products_active_idx ON products (category, location) WHERE status = 'Active';
CREATE INDEX products_farmer_idx ON products (farmer_id);

-- One order is one buyer buying from one farmer.
-- Mixed carts are split in place_order(), not stored as one header with two farmers.
CREATE TABLE orders (
  order_id   SERIAL PRIMARY KEY,
  buyer_id   INT NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
  farmer_id  INT NOT NULL REFERENCES farmer_profiles (user_id) ON DELETE RESTRICT,
  status     order_status NOT NULL DEFAULT 'Placed',
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (buyer_id <> farmer_id)
);

CREATE INDEX orders_buyer_idx ON orders (buyer_id, created_at DESC);
CREATE INDEX orders_farmer_status_idx ON orders (farmer_id, status);

-- unit_price is a deliberate copy of products.price at purchase time.
-- If the farmer later changes the listing price, old orders must stay unchanged.
CREATE TABLE order_items (
  order_id   INT NOT NULL REFERENCES orders (order_id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products (product_id) ON DELETE RESTRICT,
  quantity   NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  PRIMARY KEY (order_id, product_id)
);

CREATE INDEX order_items_product_idx ON order_items (product_id);

CREATE TABLE favourites (
  user_id    INT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE messages (
  message_id  SERIAL PRIMARY KEY,
  sender_id   INT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  product_id  INT REFERENCES products (product_id) ON DELETE SET NULL,
  order_id    INT REFERENCES orders (order_id) ON DELETE SET NULL,
  body        TEXT NOT NULL CHECK (length(btrim(body)) > 0),
  read_at     TIMESTAMPTZ,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX messages_receiver_idx ON messages (receiver_id, sent_at DESC);

-- One review per completed order. The "completed" rule is a trigger:
-- a check constraint cannot read the orders row.
CREATE TABLE reviews (
  order_id   INT PRIMARY KEY REFERENCES orders (order_id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Written by a trigger. Not updated by the application.
CREATE TABLE order_status_log (
  log_id     BIGSERIAL PRIMARY KEY,
  order_id   INT NOT NULL REFERENCES orders (order_id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_status_log_order_idx ON order_status_log (order_id, changed_at);

COMMIT;
