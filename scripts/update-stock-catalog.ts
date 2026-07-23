/**
 * 增量更新 stock_catalog。
 * 默认合并本地种子列表；后续可替换为外部 CSV/JSON 导入。
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type Row = { code: string; name: string; market: string };

async function main() {
  const extraPath = path.resolve(
    process.cwd(),
    "../../data/stock-catalog.json"
  );
  let rows: Row[] = [];
  if (existsSync(extraPath)) {
    rows = JSON.parse(readFileSync(extraPath, "utf8")) as Row[];
  } else {
    console.log("No data/stock-catalog.json — seeding defaults via prisma seed");
    console.log("Create data/stock-catalog.json to bulk-update.");
    process.exit(0);
  }

  let n = 0;
  for (const s of rows) {
    await prisma.stockCatalog.upsert({
      where: { code: s.code },
      update: { name: s.name, market: s.market },
      create: s,
    });
    n++;
  }
  console.log(`Updated ${n} stocks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
