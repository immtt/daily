-- AlterTable
ALTER TABLE "diary_entries" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "diary_entries" ADD COLUMN "pinned_at" TIMESTAMPTZ(6);
ALTER TABLE "diary_entries" ADD COLUMN "search_text" TEXT NOT NULL DEFAULT '';

-- Backfill search_text from title for existing rows
UPDATE "diary_entries" SET "search_text" = "title" WHERE "search_text" = '';

-- CreateIndex
CREATE INDEX "idx_diary_entries_user_pinned" ON "diary_entries"("user_id", "pinned", "pinned_at" DESC);
