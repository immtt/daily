-- AlterTable
ALTER TABLE "diary_entries" ADD COLUMN "category" VARCHAR(16) NOT NULL DEFAULT 'review';

-- CreateIndex
CREATE INDEX "idx_diary_entries_user_category" ON "diary_entries"("user_id", "category");
