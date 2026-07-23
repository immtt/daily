import type { PrismaClient } from "@prisma/client";

const CODE_RE = /\b([036]\d{5})\b/g;

export type StockMatch = { code: string; name: string; market: string };

export async function matchStocksInText(
  prisma: PrismaClient,
  text: string
): Promise<StockMatch[]> {
  if (!text.trim()) return [];

  const codeSet = new Set<string>();
  for (const m of text.matchAll(CODE_RE)) codeSet.add(m[1]);

  const byCode = new Map<string, StockMatch>();
  if (codeSet.size > 0) {
    const catalog = await prisma.stockCatalog.findMany({
      where: { code: { in: [...codeSet] } },
    });
    const nameMap = new Map(catalog.map((s) => [s.code, s]));
    for (const code of codeSet) {
      const hit = nameMap.get(code);
      byCode.set(
        code,
        hit
          ? { code: hit.code, name: hit.name, market: hit.market }
          : { code, name: code, market: "" }
      );
    }
  }

  const catalog = await prisma.stockCatalog.findMany({
    select: { code: true, name: true, market: true },
  });
  const nameHits = catalog
    .filter((s) => s.name.length >= 2 && text.includes(s.name))
    .sort((a, b) => b.name.length - a.name.length);

  const result = new Map<string, StockMatch>();
  for (const s of byCode.values()) result.set(s.code, s);
  for (const s of nameHits) {
    const tagged = `${s.code} ${s.name}`;
    if (text.includes(tagged) || result.has(s.code)) {
      result.set(s.code, s);
      continue;
    }
    result.set(s.code, s);
  }

  return [...result.values()];
}

export async function resolveStockFilter(
  prisma: PrismaClient,
  query: string
): Promise<{ codes: string[]; nameContains: string | null }> {
  const q = query.trim();
  if (!q) return { codes: [], nameContains: null };
  if (/^[036]\d{5}$/.test(q)) return { codes: [q], nameContains: null };

  const catalog = await prisma.stockCatalog.findMany({
    where: {
      OR: [{ code: { contains: q } }, { name: { contains: q } }],
    },
    take: 50,
    select: { code: true },
  });
  return {
    codes: catalog.map((s) => s.code),
    nameContains: q,
  };
}
