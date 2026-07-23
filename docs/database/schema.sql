-- 股票复盘日记本 — 标准数据库 Schema
-- PostgreSQL 16+
-- 执行前: CREATE DATABASE stock_diary;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== 枚举 ==========
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== users ==========
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'user',
  status        user_status  NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ========== stock_catalog ==========
CREATE TABLE IF NOT EXISTS stock_catalog (
  code       VARCHAR(16) PRIMARY KEY,
  name       VARCHAR(64) NOT NULL,
  market     VARCHAR(8)  NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_catalog_name ON stock_catalog (name);

-- ========== diary_entries ==========
CREATE TABLE IF NOT EXISTS diary_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(200)   NOT NULL,
  entry_date      DATE           NOT NULL,
  pnl_day         DECIMAL(12, 2),
  pnl_total       DECIMAL(12, 2),
  mood            VARCHAR(20),
  market_snapshot JSONB,
  content         JSONB          NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date
  ON diary_entries (user_id, entry_date DESC);

-- ========== diary_stocks ==========
CREATE TABLE IF NOT EXISTS diary_stocks (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID        NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  code     VARCHAR(16) NOT NULL,
  name     VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diary_stocks_entry ON diary_stocks (entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_stocks_code  ON diary_stocks (code);

-- ========== updated_at 触发器 ==========
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_diary_entries_updated ON diary_entries;
CREATE TRIGGER trg_diary_entries_updated
  BEFORE UPDATE ON diary_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
