import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatDate, parseDateOnly, sendError, toNum } from "../lib/util.js";
import type { Prisma } from "@prisma/client";

const stockSchema = z.object({
  code: z.string().min(1).max(16),
  name: z.string().min(1).max(64),
});

const entryBodySchema = z.object({
  title: z.string().min(1).max(200),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stocks: z.array(stockSchema).optional().default([]),
  pnlDay: z.union([z.number(), z.string(), z.null()]).optional(),
  pnlTotal: z.union([z.number(), z.string(), z.null()]).optional(),
  mood: z.string().max(20).nullable().optional(),
  marketSnapshot: z.any().nullable().optional(),
  content: z.any().optional().default({ type: "doc", content: [] }),
});

function serializeEntry(
  e: {
    id: string;
    title: string;
    entryDate: Date;
    pnlDay: Prisma.Decimal | null;
    pnlTotal: Prisma.Decimal | null;
    mood: string | null;
    marketSnapshot: Prisma.JsonValue | null;
    content?: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
    stocks: Array<{ code: string; name: string }>;
  },
  withContent = false
) {
  const base = {
    id: e.id,
    title: e.title,
    entryDate: formatDate(e.entryDate),
    stocks: e.stocks.map((s) => ({ code: s.code, name: s.name })),
    pnlDay: e.pnlDay == null ? null : Number(e.pnlDay),
    pnlTotal: e.pnlTotal == null ? null : Number(e.pnlTotal),
    mood: e.mood,
    marketSnapshot: e.marketSnapshot,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
  if (withContent) {
    return { ...base, content: e.content ?? { type: "doc", content: [] } };
  }
  return base;
}

async function resolveStocks(
  stocks: Array<{ code: string; name: string }>,
  content: unknown
) {
  const fromBody = new Map(stocks.map((s) => [s.code, s.name]));
  const codes = new Set<string>([...fromBody.keys()]);

  const text = JSON.stringify(content ?? {});
  const matches = text.match(/\b([036]\d{5})\b/g) ?? [];
  for (const c of matches) codes.add(c);

  if (codes.size === 0) return [] as Array<{ code: string; name: string }>;

  const catalog = await prisma.stockCatalog.findMany({
    where: { code: { in: [...codes] } },
  });
  const nameMap = new Map(catalog.map((c) => [c.code, c.name]));

  return [...codes].map((code) => ({
    code,
    name: fromBody.get(code) || nameMap.get(code) || code,
  }));
}

export async function entryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/entries", async (req) => {
    const q = req.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));
    const where: Prisma.DiaryEntryWhereInput = { userId: req.user.id };

    if (q.from || q.to) {
      where.entryDate = {};
      if (q.from) where.entryDate.gte = parseDateOnly(q.from);
      if (q.to) where.entryDate.lte = parseDateOnly(q.to);
    }
    if (q.stockCode) {
      where.stocks = { some: { code: q.stockCode } };
    }

    const [total, items] = await Promise.all([
      prisma.diaryEntry.count({ where }),
      prisma.diaryEntry.findMany({
        where,
        include: { stocks: true },
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map((e) => serializeEntry(e)),
      total,
      page,
      pageSize,
    };
  });

  app.post("/entries", async (req, reply) => {
    const parsed = entryBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
    }
    const data = parsed.data;
    const stocks = await resolveStocks(data.stocks, data.content);

    const entry = await prisma.diaryEntry.create({
      data: {
        userId: req.user.id,
        title: data.title.trim(),
        entryDate: parseDateOnly(data.entryDate),
        pnlDay: toNum(data.pnlDay),
        pnlTotal: toNum(data.pnlTotal),
        mood: data.mood ?? null,
        marketSnapshot: data.marketSnapshot ?? undefined,
        content: data.content ?? { type: "doc", content: [] },
        stocks: { create: stocks },
      },
      include: { stocks: true },
    });

    return reply.status(201).send(serializeEntry(entry, true));
  });

  app.get("/entries/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const entry = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id },
      include: { stocks: true },
    });
    if (!entry) return sendError(reply, 404, "日记不存在", "NOT_FOUND");
    return serializeEntry(entry, true);
  });

  app.patch("/entries/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return sendError(reply, 404, "日记不存在", "NOT_FOUND");

    const parsed = entryBodySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
    }
    const data = parsed.data;
    const stocks =
      data.stocks !== undefined || data.content !== undefined
        ? await resolveStocks(
            data.stocks ?? [],
            data.content ?? existing.content
          )
        : null;

    const entry = await prisma.$transaction(async (tx) => {
      if (stocks) {
        await tx.diaryStock.deleteMany({ where: { entryId: id } });
      }
      return tx.diaryEntry.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title.trim() } : {}),
          ...(data.entryDate !== undefined
            ? { entryDate: parseDateOnly(data.entryDate) }
            : {}),
          ...(data.pnlDay !== undefined ? { pnlDay: toNum(data.pnlDay) } : {}),
          ...(data.pnlTotal !== undefined
            ? { pnlTotal: toNum(data.pnlTotal) }
            : {}),
          ...(data.mood !== undefined ? { mood: data.mood } : {}),
          ...(data.marketSnapshot !== undefined
            ? { marketSnapshot: data.marketSnapshot }
            : {}),
          ...(data.content !== undefined ? { content: data.content } : {}),
          ...(stocks ? { stocks: { create: stocks } } : {}),
        },
        include: { stocks: true },
      });
    });

    return serializeEntry(entry, true);
  });

  app.delete("/entries/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return sendError(reply, 404, "日记不存在", "NOT_FOUND");
    await prisma.diaryEntry.delete({ where: { id } });
    return reply.status(204).send();
  });
}
