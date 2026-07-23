-- AlterTable: soft delete (废纸篓)
ALTER TABLE "diary_entries" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "idx_diary_entries_user_trash"
  ON "diary_entries"("user_id", "deleted_at");
