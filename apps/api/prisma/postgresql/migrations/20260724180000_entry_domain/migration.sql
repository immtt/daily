-- AlterTable
ALTER TABLE "diary_entries" ADD COLUMN "domain" VARCHAR(16) NOT NULL DEFAULT 'stock';

-- CreateIndex
CREATE INDEX "idx_diary_entries_user_domain" ON "diary_entries"("user_id", "domain");
