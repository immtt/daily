import { prisma } from "../lib/prisma.js";
import { fetchAllAShareCatalog } from "./eastmoney.js";

const MIN_ROWS = 100;

export async function ensureStockCatalog(): Promise<number> {
  const existing = await prisma.stockCatalog.count();
  if (existing >= MIN_ROWS) {
    console.log(`stock_catalog already has ${existing} rows — skip sync`);
    return existing;
  }

  console.log(
    `stock_catalog has ${existing} rows — syncing A-share catalog…`
  );
  const rows = await fetchAllAShareCatalog();
  if (rows.length === 0) {
    throw new Error("Stock catalog sync returned 0 rows — check network");
  }

  let n = 0;
  for (const s of rows) {
    await prisma.stockCatalog.upsert({
      where: { code: s.code },
      update: { name: s.name, market: s.market },
      create: s,
    });
    n++;
    if (n % 500 === 0) console.log(`  stock_catalog sync ${n}/${rows.length}…`);
  }
  console.log(`Synced ${n} stocks to stock_catalog`);
  return n;
}
