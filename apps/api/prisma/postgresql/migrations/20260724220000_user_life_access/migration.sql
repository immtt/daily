-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "life_access_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "life_password_hash" VARCHAR(255);
