-- CreateTable
CREATE TABLE "diary_cities" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "city" VARCHAR(64) NOT NULL,

    CONSTRAINT "diary_cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_diary_cities_entry" ON "diary_cities"("entry_id");

-- CreateIndex
CREATE INDEX "idx_diary_cities_city" ON "diary_cities"("city");

-- AddForeignKey
ALTER TABLE "diary_cities" ADD CONSTRAINT "diary_cities_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "diary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate location labels to city tags where possible
INSERT INTO "diary_cities" ("id", "entry_id", "city")
SELECT gen_random_uuid(), "id", trim("location"->>'label')
FROM "diary_entries"
WHERE "domain" = 'life'
  AND "location" IS NOT NULL
  AND trim(coalesce("location"->>'label', '')) <> '';

-- DropColumn
ALTER TABLE "diary_entries" DROP COLUMN "location";
