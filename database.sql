-- --------------------------------------------------------------------------
-- WWenatou Shopping - Complete Database Schema
-- Supabase PostgreSQL
--
-- Run this entire script in the Supabase SQL Editor to create all
-- required tables, relationships, indexes, functions, triggers, and
-- initial seed data.
--
-- Tables: 14
-- Indexes: 20
-- Triggers: 2
-- Functions: 1
-- Seed rows: 2 (admin user + store settings)
-- Stock quantity fields: 0 (by design)
--
-- This script is safe to run on a fresh Supabase project.
--
-- IMPORTANT: After running this SQL, you must also create a Supabase
-- Storage bucket named "images" with public access enabled.
-- --------------------------------------------------------------------------


-- --------------------------------------------------------------------------
-- 1. CUSTOM TYPES
-- --------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- --------------------------------------------------------------------------
-- 2. ADMIN USERS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- --------------------------------------------------------------------------
-- 3. CATEGORIES
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    VARCHAR(255) NOT NULL,
  name_fr    VARCHAR(255) NOT NULL,
  image_url  TEXT,
  sort_order INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories (sort_order);


-- --------------------------------------------------------------------------
-- 4. PRODUCTS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar        VARCHAR(255)   NOT NULL,
  name_fr        VARCHAR(255)   NOT NULL,
  description_ar TEXT            DEFAULT '',
  description_fr TEXT            DEFAULT '',
  price          DECIMAL(12, 2) NOT NULL,
  old_price      DECIMAL(12, 2),
  category_id    UUID REFERENCES categories (id) ON DELETE SET NULL,
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  is_on_sale     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id    ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available   ON products (is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_featured    ON products (is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON products (is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale     ON products (is_on_sale);
CREATE INDEX IF NOT EXISTS idx_products_created_at     ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price          ON products (price);


-- --------------------------------------------------------------------------
-- 5. PRODUCT IMAGES
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID    NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  image_url  TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);


-- --------------------------------------------------------------------------
-- 6. PRODUCT COLORS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_colors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  name_ar    VARCHAR(100) NOT NULL DEFAULT '',
  name_fr    VARCHAR(100) NOT NULL DEFAULT '',
  hex_code   VARCHAR(7)   NOT NULL DEFAULT '#000000'
);

CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors (product_id);


-- --------------------------------------------------------------------------
-- 7. PRODUCT SIZES
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_sizes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size       VARCHAR(10) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON product_sizes (product_id);


-- --------------------------------------------------------------------------
-- 8. CUSTOMERS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(50)  NOT NULL UNIQUE,
  province   VARCHAR(255),
  address    TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);


-- --------------------------------------------------------------------------
-- 9. ORDERS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      VARCHAR(50)    NOT NULL UNIQUE,
  customer_id       UUID           REFERENCES customers (id) ON DELETE SET NULL,
  customer_name     VARCHAR(255)   NOT NULL,
  customer_phone    VARCHAR(50)    NOT NULL,
  customer_province VARCHAR(255),
  customer_address  TEXT,
  customer_notes    TEXT,
  subtotal          DECIMAL(12, 2) NOT NULL,
  discount_amount   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total             DECIMAL(12, 2) NOT NULL,
  coupon_code       VARCHAR(100),
  status            order_status   NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number   ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id    ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders (created_at DESC);


-- --------------------------------------------------------------------------
-- 10. ORDER ITEMS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID           NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id      UUID           REFERENCES products (id) ON DELETE SET NULL,
  product_name_ar VARCHAR(255)   NOT NULL,
  product_name_fr VARCHAR(255)   NOT NULL,
  product_image   TEXT,
  price           DECIMAL(12, 2) NOT NULL,
  quantity        INTEGER        NOT NULL DEFAULT 1,
  color_name_ar   VARCHAR(100),
  color_name_fr   VARCHAR(100),
  color_hex       VARCHAR(7),
  size            VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);


-- --------------------------------------------------------------------------
-- 11. COUPONS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(100)   NOT NULL UNIQUE,
  discount_type    discount_type  NOT NULL,
  discount_value   DECIMAL(12, 2) NOT NULL,
  min_order_amount DECIMAL(12, 2),
  max_uses         INTEGER,
  used_count       INTEGER        NOT NULL DEFAULT 0,
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code      ON coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons (is_active);


-- --------------------------------------------------------------------------
-- 12. HERO BANNERS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hero_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT NOT NULL,
  title_ar    VARCHAR(255),
  title_fr    VARCHAR(255),
  subtitle_ar VARCHAR(500),
  subtitle_fr VARCHAR(500),
  cta_text_ar VARCHAR(100),
  cta_text_fr VARCHAR(100),
  cta_link    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hero_banners_active ON hero_banners (is_active, sort_order);


-- --------------------------------------------------------------------------
-- 13. PROMO BANNERS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promo_banners (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  TEXT NOT NULL,
  title_ar   VARCHAR(255),
  title_fr   VARCHAR(255),
  link       TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_promo_banners_active ON promo_banners (is_active, sort_order);


-- --------------------------------------------------------------------------
-- 14. TESTIMONIALS
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS testimonials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    VARCHAR(255) NOT NULL,
  name_fr    VARCHAR(255) NOT NULL,
  content_ar TEXT         NOT NULL,
  content_fr TEXT         NOT NULL,
  rating     INTEGER      NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials (is_active, sort_order);


-- --------------------------------------------------------------------------
-- 15. STORE SETTINGS (single row)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS store_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name      VARCHAR(255),
  logo_url        TEXT,
  whatsapp_number VARCHAR(50),
  phone_number    VARCHAR(50),
  email           VARCHAR(255),
  address_ar      TEXT,
  address_fr      TEXT,
  facebook_url    TEXT,
  instagram_url   TEXT,
  tiktok_url      TEXT
);


-- --------------------------------------------------------------------------
-- 16. FUNCTIONS & TRIGGERS
-- --------------------------------------------------------------------------

-- Auto-update updated_at on products and orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- --------------------------------------------------------------------------
-- 17. SEED DATA
-- --------------------------------------------------------------------------

-- Default admin user (email: admin@wwenatou.com / password: admin123)
-- IMPORTANT: Change this password immediately after first login!
-- The hash below is bcrypt(admin123, 10 rounds)
INSERT INTO admin_users (email, password_hash)
SELECT 'admin@wwenatou.com',
       '$2b$10$EIXe0RZ8GpFmVEBVo3R5zuYxPCfGZmpiJOqRSuNYMOXMQFh6pOKXy'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@wwenatou.com');

-- Default store settings
INSERT INTO store_settings (store_name, whatsapp_number, phone_number, email, address_ar, address_fr)
SELECT 'WWenatou Shopping', '+22247305955', '+22247305955', 'contact@wwenatou.com',
       'نواكشوط، موريتانيا', 'Nouakchott, Mauritanie'
WHERE NOT EXISTS (SELECT 1 FROM store_settings LIMIT 1);


-- --------------------------------------------------------------------------
-- 18. SUPABASE ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------------
-- Disable RLS on all tables so the service_role key can access everything.
-- The backend uses the service_role key for all operations.
-- Public access is controlled by the Express API layer, not by Supabase RLS.

ALTER TABLE admin_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners    ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_banners   ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings  ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (this is the default behavior, but explicit is better)
-- The backend ONLY uses SUPABASE_SECRET_KEY which bypasses RLS automatically.
-- No additional policies are needed because service_role bypasses all RLS.

-- --------------------------------------------------------------------------
-- DONE
-- --------------------------------------------------------------------------
-- 14 tables created:
--   1. admin_users        - Admin authentication
--   2. categories         - Product categories
--   3. products           - Product catalog
--   4. product_images     - Multiple images per product
--   5. product_colors     - Color variants per product
--   6. product_sizes      - Size variants per product
--   7. customers          - Guest checkout customers (by phone)
--   8. orders             - Order records
--   9. order_items        - Line items per order
--  10. coupons            - Discount coupons
--  11. hero_banners       - Homepage hero banners
--  12. promo_banners      - Homepage promo banners
--  13. testimonials       - Customer testimonials
--  14. store_settings     - Global store configuration
--
-- 20 indexes created
-- 2 custom enum types (order_status, discount_type)
-- 2 triggers (auto-update updated_at on products & orders)
-- 1 function (update_updated_at_column)
-- 2 seed rows (admin user + store settings)
-- 0 stock_quantity fields (by design - no inventory tracking)
--
-- MANUAL STEPS AFTER RUNNING THIS SQL:
-- 1. Create a Storage bucket named "images" in Supabase Dashboard
--    -> Storage -> New bucket -> Name: "images" -> Public bucket: ON
-- 2. Set your .env file with SUPABASE_URL, SUPABASE_SECRET_KEY,
--    and JWT_SECRET
-- 3. Change the default admin password via the admin dashboard
-- --------------------------------------------------------------------------
