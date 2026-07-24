-- AlterTable
ALTER TABLE "diary_entries" ADD COLUMN "tag" VARCHAR(32);

-- CreateIndex
CREATE INDEX "idx_diary_entries_user_domain_tag" ON "diary_entries"("user_id", "domain", "tag");
