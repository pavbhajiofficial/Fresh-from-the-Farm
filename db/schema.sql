-- PostgreSQL schema that matches lib/types.ts. Starting point for the DB teammate.
CREATE TYPE user_role      AS ENUM ('farmer', 'buyer');
CREATE TYPE product_status AS ENUM ('Active', 'Draft', 'Sold Out');
CREATE TYPE order_status   AS ENUM ('Placed', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Rejected');

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

CREATE TABLE farmer_profiles (
  user_id   INT PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  verified  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE products (
  product_id    SERIAL PRIMARY KEY,
  farmer_id     INT NOT NULL REFERENCES farmer_profiles(user_id),
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
CREATE INDEX products_search ON products (status, category, location, price);

CREATE TABLE orders (
  order_id   SERIAL PRIMARY KEY,
  buyer_id   INT NOT NULL REFERENCES users,
  farmer_id  INT NOT NULL REFERENCES farmer_profiles(user_id),  -- one order per farmer
  status     order_status NOT NULL DEFAULT 'Placed',
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id   INT REFERENCES orders ON DELETE CASCADE,
  product_id INT REFERENCES products,
  quantity   NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,  -- price at the time of purchase
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE favourites (user_id INT REFERENCES users, product_id INT REFERENCES products, PRIMARY KEY (user_id, product_id));
CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY, sender_id INT REFERENCES users, receiver_id INT REFERENCES users,
  product_id INT REFERENCES products, order_id INT REFERENCES orders,
  body TEXT NOT NULL, read_at TIMESTAMPTZ, sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE reviews (
  order_id INT PRIMARY KEY REFERENCES orders, rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), comment TEXT
);
-- Stock must be re-checked and decremented inside the order transaction (SELECT ... FOR UPDATE).
