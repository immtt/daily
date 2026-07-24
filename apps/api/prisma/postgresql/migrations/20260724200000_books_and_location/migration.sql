-- AlterTable
ALTER TABLE "diary_entries" ADD COLUMN "location" JSONB;

-- CreateTable
CREATE TABLE "diary_books" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "title" VARCHAR(128) NOT NULL,

    CONSTRAINT "diary_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_diary_books_entry" ON "diary_books"("entry_id");

-- CreateIndex
CREATE INDEX "idx_diary_books_title" ON "diary_books"("title");

-- AddForeignKey
ALTER TABLE "diary_books" ADD CONSTRAINT "diary_books_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "diary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
