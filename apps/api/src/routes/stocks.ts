import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { matchStocksInText } from "../services/stockMatch.js";

export async function stockRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/stocks/resolve-text", async (req) => {
    const text = (req.body as { text?: string })?.text ?? "";
    const items = await matchStocksInText(prisma, text);
    return { items };
  });

  app.get("/stocks/lookup", async (req) => {
    const q = req.query as { codes?: string };
    const codes = (q.codes || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (codes.length === 0) return { items: [] };
    const items = await prisma.stockCatalog.findMany({
      where: { code: { in: codes } },
    });
    return {
      items: items.map((s) => ({
        code: s.code,
        name: s.name,
        market: s.market,
      })),
    };
  });

  app.get("/stocks/search", async (req) => {
    const q = (req.query as { q?: string }).q?.trim() || "";
    if (!q) return { items: [] };
    const items = await prisma.stockCatalog.findMany({
      where: {
        OR: [{ code: { contains: q } }, { name: { contains: q } }],
      },
      take: 20,
      orderBy: { code: "asc" },
    });
    return {
      items: items.map((s) => ({
        code: s.code,
        name: s.name,
        market: s.market,
      })),
    };
  });
}
