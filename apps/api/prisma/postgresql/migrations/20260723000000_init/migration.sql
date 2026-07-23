-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_catalog" (
    "code" VARCHAR(16) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "market" VARCHAR(8) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "stock_catalog_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "diary_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "entry_date" DATE NOT NULL,
    "pnl_day" DECIMAL(12,2),
    "pnl_total" DECIMAL(12,2),
    "mood" VARCHAR(20),
    "market_snapshot" JSONB,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_stocks" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    CONSTRAINT "diary_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_stock_catalog_name" ON "stock_catalog"("name");

-- CreateIndex
CREATE INDEX "idx_diary_entries_user_date" ON "diary_entries"("user_id", "entry_date" DESC);

-- CreateIndex
CREATE INDEX "idx_diary_stocks_entry" ON "diary_stocks"("entry_id");

-- CreateIndex
CREATE INDEX "idx_diary_stocks_code" ON "diary_stocks"("code");

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_stocks" ADD CONSTRAINT "diary_stocks_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "diary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
