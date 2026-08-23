-- ============================================================
-- WWenatou Shopping - Database Schema
-- E-commerce store for women's fashion in Mauritania
-- PostgreSQL 13+ / Supabase
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TYPE discount_type AS ENUM (
  'percentage',
  'fixed'
);

-- ============================================================
-- 1. ADMIN USERS
-- ============================================================

CREATE TABLE admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    VARCHAR(255) NOT NULL,
  name_fr    VARCHAR(255) NOT NULL,
  image_url  TEXT,
  sort_order INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_sort_order ON categories (sort_order);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar         VARCHAR(255) NOT NULL,
  name_fr         VARCHAR(255) NOT NULL,
  description_ar  TEXT,
  description_fr  TEXT,
  price           DECIMAL(10, 2) NOT NULL,
  old_price       DECIMAL(10, 2),
  category_id     UUID NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival   BOOLEAN NOT NULL DEFAULT FALSE,
  is_on_sale       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_id   ON products (category_id);
CREATE INDEX idx_products_is_available  ON products (is_available);
CREATE INDEX idx_products_is_featured   ON products (is_featured);
CREATE INDEX idx_products_is_new_arrival ON products (is_new_arrival);
CREATE INDEX idx_products_is_on_sale    ON products (is_on_sale);
CREATE INDEX idx_products_created_at    ON products (created_at DESC);

-- ============================================================
-- 4. PRODUCT IMAGES
-- ============================================================

CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID    NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  image_url  TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_product_images_product_id ON product_images (product_id);

-- ============================================================
-- 5. PRODUCT COLORS
-- ============================================================

CREATE TABLE product_colors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  name_ar    VARCHAR(100) NOT NULL,
  name_fr    VARCHAR(100) NOT NULL,
  hex_code   VARCHAR(7)   NOT NULL
);

CREATE INDEX idx_product_colors_product_id ON product_colors (product_id);

-- ============================================================
-- 6. PRODUCT SIZES
-- ============================================================

CREATE TABLE product_sizes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size       VARCHAR(10) NOT NULL
);

CREATE INDEX idx_product_sizes_product_id ON product_sizes (product_id);

-- ============================================================
-- 7. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(50)  NOT NULL UNIQUE,
  province   VARCHAR(255),
  address    TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers (phone);

-- ============================================================
-- 8. ORDERS
-- ============================================================

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      VARCHAR(50)    NOT NULL UNIQUE,
  customer_id       UUID           REFERENCES customers (id) ON DELETE SET NULL,
  customer_name     VARCHAR(255)   NOT NULL,
  customer_phone    VARCHAR(50)    NOT NULL,
  customer_province VARCHAR(255),
  customer_address  TEXT,
  customer_notes    TEXT,
  subtotal          DECIMAL(10, 2) NOT NULL,
  discount_amount   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total             DECIMAL(10, 2) NOT NULL,
  coupon_code       VARCHAR(100),
  status            order_status   NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders (order_number);
CREATE INDEX idx_orders_customer_id  ON orders (customer_id);
CREATE INDEX idx_orders_status       ON orders (status);
CREATE INDEX idx_orders_created_at   ON orders (created_at DESC);

-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID           NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id      UUID           REFERENCES products (id) ON DELETE SET NULL,
  product_name_ar VARCHAR(255)   NOT NULL,
  product_name_fr VARCHAR(255)   NOT NULL,
  product_image   TEXT,
  price           DECIMAL(10, 2) NOT NULL,
  quantity        INTEGER        NOT NULL DEFAULT 1,
  color_name_ar   VARCHAR(100),
  color_name_fr   VARCHAR(100),
  color_hex       VARCHAR(7),
  size            VARCHAR(10)
);

CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);

-- ============================================================
-- 10. COUPONS
-- ============================================================

CREATE TABLE coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(100)   NOT NULL UNIQUE,
  discount_type    discount_type  NOT NULL,
  discount_value   DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2),
  max_uses         INTEGER,
  used_count       INTEGER        NOT NULL DEFAULT 0,
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code      ON coupons (code);
CREATE INDEX idx_coupons_is_active ON coupons (is_active);

-- ============================================================
-- 11. HERO BANNERS
-- ============================================================

CREATE TABLE hero_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT         NOT NULL,
  title_ar    VARCHAR(255),
  title_fr    VARCHAR(255),
  subtitle_ar VARCHAR(500),
  subtitle_fr VARCHAR(500),
  cta_text_ar VARCHAR(100),
  cta_text_fr VARCHAR(100),
  cta_link    TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_hero_banners_is_active ON hero_banners (is_active, sort_order);

-- ============================================================
-- 12. PROMO BANNERS
-- ============================================================

CREATE TABLE promo_banners (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  TEXT         NOT NULL,
  title_ar   VARCHAR(255),
  title_fr   VARCHAR(255),
  link       TEXT,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_promo_banners_is_active ON promo_banners (is_active, sort_order);

-- ============================================================
-- 13. TESTIMONIALS
-- ============================================================

CREATE TABLE testimonials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    VARCHAR(255) NOT NULL,
  name_fr    VARCHAR(255) NOT NULL,
  content_ar TEXT         NOT NULL,
  content_fr TEXT         NOT NULL,
  rating     INTEGER      NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_testimonials_is_active ON testimonials (is_active, sort_order);

-- ============================================================
-- 14. STORE SETTINGS
-- ============================================================

CREATE TABLE store_settings (
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

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default admin user (password: admin123 - change immediately after first login)
-- Hash generated with bcrypt, 10 rounds
INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@wwenatou.com',
  '$2b$10$EIXe0RZ8GpFmVEBVo3R5zuYxPCfGZmpiJOqRSuNYMOXMQFh6pOKXy'
);

-- Default store settings
INSERT INTO store_settings (
  store_name,
  whatsapp_number,
  phone_number,
  email
)
VALUES (
  'WWenatou Shopping',
  '+22200000000',
  '+22200000000',
  'contact@wwenatou.com'
);
