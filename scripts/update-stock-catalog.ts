/**
 * 从东方财富生产接口同步 A 股代码库到 stock_catalog。
 * 用法：cd apps/api && npm run update-stocks
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fetchAllAShareCatalog } from "../apps/api/src/services/eastmoney.js";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.stockCatalog.count();
  if (process.argv.includes("--if-empty") && existing > 100) {
    console.log(`stock_catalog already has ${existing} rows — skip`);
    return;
  }

  console.log("Fetching A-share list from East Money…");
  const rows = await fetchAllAShareCatalog();
  if (rows.length === 0) {
    throw new Error("East Money returned 0 stocks — check network");
  }

  let n = 0;
  for (const s of rows) {
    await prisma.stockCatalog.upsert({
      where: { code: s.code },
      update: { name: s.name, market: s.market },
      create: s,
    });
    n++;
    if (n % 500 === 0) console.log(`  ${n}/${rows.length}…`);
  }
  console.log(`Synced ${n} stocks to stock_catalog`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
