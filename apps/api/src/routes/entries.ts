import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatDate, parseDateOnly, sendError, toNum, entryIdPath } from "../lib/util.js";
import { purgeAt, TRASH_RETENTION_DAYS } from "../services/trash.js";
import { matchStocksInText, resolveStockFilter } from "../services/stockMatch.js";
import { buildSearchText } from "../lib/searchText.js";
import { assertTagForDomain } from "../lib/entryTags.js";
import {
  userHasLifeAccess,
  userLifeAccessRequired,
} from "../lib/lifeAccess.js";
import { normalizeBooks } from "../lib/entryBooks.js";
import { assertLocationForDomain, locationSchema } from "../lib/entryLocation.js";
import { assertMoodScoreForDomain } from "../lib/entryMood.js";
import { Prisma } from "@prisma/client";

const stockSchema = z.object({
  code: z.string().min(1).max(16),
  name: z.string().min(1).max(64),
});

const bookSchema = z.object({
  title: z.string().min(1).max(128),
});

const categorySchema = z.enum(["review", "mindset"]);
const domainSchema = z.enum(["stock", "reading", "life"]);

const entryBodySchema = z.object({
  domain: domainSchema.default("stock"),
  title: z.string().min(1).max(200),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: categorySchema.optional(),
  stocks: z.array(stockSchema).optional().default([]),
  pnlDay: z.union([z.number(), z.string(), z.null()]).optional(),
  pnlTotal: z.union([z.number(), z.string(), z.null()]).optional(),
  mood: z.string().max(20).nullable().optional(),
  moodScore: z
    .union([z.number().int().min(0).max(100), z.string(), z.null()])
    .optional(),
  tag: z.string().max(32).nullable().optional(),
  books: z.array(bookSchema).optional().default([]),
  location: locationSchema.optional(),
  marketSnapshot: z.any().nullable().optional(),
  content: z.any().optional().default({ type: "doc", content: [] }),
});

const entryInclude = { stocks: true, books: true } as const;

const activeOnly = { deletedAt: null } as const;

function toPrismaJsonField(
  value: Prisma.InputJsonValue | null | undefined
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return value;
}

function parseDomain(v: string | undefined) {
  const parsed = domainSchema.safeParse(v);
  return parsed.success ? parsed.data : null;
}

function normalizeDomain(v: string | null | undefined): "stock" | "reading" | "life" {
  if (v === "reading" || v === "life") return v;
  return "stock";
}

async function requireLifeAccess(
  req: {
    user: { id: string };
    headers: Record<string, string | string[] | undefined>;
  },
  reply: FastifyReply,
  domain: string | null | undefined
) {
  if (normalizeDomain(domain) !== "life") return true;
  if (!(await userLifeAccessRequired(req.user.id))) return true;
  if (await userHasLifeAccess(req.user.id, req.headers["x-life-access"])) {
    return true;
  }
  sendError(reply, 403, "需要生活栏目访问密码", "FORBIDDEN");
  return false;
}

async function enrichStocks(stocks: Array<{ code: string; name: string }>) {
  if (stocks.length === 0) return stocks;
  const codes = stocks.map((s) => s.code);
  const catalog = await prisma.stockCatalog.findMany({
    where: { code: { in: codes } },
  });
  const nameMap = new Map(catalog.map((c) => [c.code, c.name]));
  return stocks.map((s) => ({
    code: s.code,
    name:
      nameMap.get(s.code) ||
      (s.name && s.name !== s.code ? s.name : undefined) ||
      s.code,
  }));
}

function serializeEntry(
  e: {
    id: string;
    title: string;
    entryDate: Date;
    domain: string;
    category: string;
    tag?: string | null;
    location?: Prisma.JsonValue | null;
    pinned?: boolean;
    pinnedAt?: Date | null;
    pnlDay: Prisma.Decimal | null;
    pnlTotal: Prisma.Decimal | null;
    mood: string | null;
    moodScore?: number | null;
    marketSnapshot: Prisma.JsonValue | null;
    content?: Prisma.JsonValue;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    stocks: Array<{ code: string; name: string }>;
    books?: Array<{ title: string }>;
  },
  withContent = false
) {
  const domain = normalizeDomain(e.domain);
  const base: Record<string, unknown> = {
    id: e.id,
    title: e.title,
    entryDate: formatDate(e.entryDate),
    domain,
    category: e.category === "mindset" ? "mindset" : "review",
    tag: e.tag ?? null,
    books: (e.books ?? []).map((b) => ({ title: b.title })),
    location: e.location ?? null,
    pinned: Boolean(e.pinned),
    pinnedAt: e.pinnedAt ? e.pinnedAt.toISOString() : null,
    stocks: e.stocks.map((s) => ({ code: s.code, name: s.name })),
    pnlDay: e.pnlDay == null ? null : Number(e.pnlDay),
    pnlTotal: e.pnlTotal == null ? null : Number(e.pnlTotal),
    mood: e.mood,
    moodScore: e.moodScore ?? null,
    marketSnapshot: e.marketSnapshot,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
  if (e.deletedAt) {
    base.deletedAt = e.deletedAt.toISOString();
    base.purgeAt = purgeAt(e.deletedAt);
  }
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
  const text = JSON.stringify(content ?? {});
  const matched = await matchStocksInText(prisma, text);
  const codes = new Set<string>([...fromBody.keys(), ...matched.map((s) => s.code)]);
  if (codes.size === 0) return [] as Array<{ code: string; name: string }>;
  const catalog = await prisma.stockCatalog.findMany({
    where: { code: { in: [...codes] } },
  });
  const nameMap = new Map(catalog.map((c) => [c.code, c.name]));
  for (const s of matched) {
    if (s.name && s.name !== s.code) nameMap.set(s.code, s.name);
  }
  return [...codes].map((code) => {
    const catalogName = nameMap.get(code);
    const clientName = fromBody.get(code);
    const name =
      catalogName ||
      (clientName && clientName !== code ? clientName : undefined) ||
      code;
    return { code, name };
  });
}

type ParsedEntryBody = z.infer<typeof entryBodySchema>;

function validateEntryBody(
  data: ParsedEntryBody,
  existingDomain?: string
):
  | {
      ok: true;
      domain: "stock" | "reading" | "life";
      data: ParsedEntryBody;
      tag: string | null;
      books: Array<{ title: string }>;
      location: Prisma.InputJsonValue | null;
      moodScore: number | null;
    }
  | { ok: false; message: string } {
  const domain = existingDomain
    ? normalizeDomain(existingDomain)
    : normalizeDomain(data.domain);

  let normalized: ParsedEntryBody;

  if (domain === "stock") {
    if (!data.category) {
      return { ok: false, message: "股票笔记请选择分类：复盘或心法" };
    }
    normalized = {
      ...data,
      domain: "stock",
      category: data.category,
      tag: null,
      books: [],
      location: null,
    };
  } else if (domain === "reading") {
    normalized = {
      ...data,
      domain: "reading",
      category: "review",
      mood: null,
      moodScore: null,
      pnlDay: null,
      pnlTotal: null,
      marketSnapshot: null,
      stocks: [],
      location: null,
    };
  } else {
    normalized = {
      ...data,
      domain: "life",
      category: "review",
      pnlDay: null,
      pnlTotal: null,
      marketSnapshot: null,
      stocks: [],
      books: [],
    };
  }

  const tagCheck = assertTagForDomain(domain, normalized.tag);
  if (!tagCheck.ok) return tagCheck;

  const locationCheck = assertLocationForDomain(domain, normalized.location);
  if (!locationCheck.ok) return locationCheck;

  const moodScoreCheck = assertMoodScoreForDomain(domain, normalized.moodScore);
  if (!moodScoreCheck.ok) return moodScoreCheck;

  const books =
    domain === "reading" ? normalizeBooks(normalized.books ?? []) : [];

  return {
    ok: true,
    domain,
    data: normalized,
    tag: tagCheck.tag,
    books,
    location: (locationCheck.location ?? null) as Prisma.InputJsonValue | null,
    moodScore: moodScoreCheck.moodScore,
  };
}

function buildEntryWriteData(
  domain: "stock" | "reading" | "life",
  data: ParsedEntryBody,
  content: Prisma.InputJsonValue,
  stocks: Array<{ code: string; name: string }>,
  tag: string | null,
  location: Prisma.InputJsonValue | null,
  moodScore: number | null
) {
  const title = data.title.trim();
  return {
    title,
    entryDate: parseDateOnly(data.entryDate),
    domain,
    category: domain === "stock" ? data.category! : "review",
    tag,
    location,
    searchText: buildSearchText(title, content),
    pnlDay: domain === "stock" ? toNum(data.pnlDay) : null,
    pnlTotal: domain === "stock" ? toNum(data.pnlTotal) : null,
    mood: domain === "reading" ? null : (data.mood ?? null),
    moodScore: domain === "reading" ? null : moodScore,
    marketSnapshot:
      domain === "stock" && data.marketSnapshot != null
        ? data.marketSnapshot
        : domain === "stock"
          ? undefined
          : null,
    content,
  };
}

export async function entryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // --- 废纸篓（须在 /entries/:id 之前注册）---
  app.get("/entries/trash", async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));
    const where: Prisma.DiaryEntryWhereInput = {
      userId: req.user.id,
      deletedAt: { not: null },
    };
    const domain = parseDomain(q.domain);
    if (domain) {
      if (!(await requireLifeAccess(req, reply, domain))) return;
      where.domain = domain;
    } else {
      const lifeProtected = await userLifeAccessRequired(req.user.id);
      if (
        lifeProtected &&
        !(await userHasLifeAccess(req.user.id, req.headers["x-life-access"]))
      ) {
        where.domain = { not: "life" };
      }
    }
    if (q.tag) where.tag = q.tag;
    const [total, items] = await Promise.all([
      prisma.diaryEntry.count({ where }),
      prisma.diaryEntry.findMany({
        where,
        include: entryInclude,
        orderBy: [{ deletedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: await Promise.all(
        items.map(async (e) =>
          serializeEntry({ ...e, stocks: await enrichStocks(e.stocks) })
        )
      ),
      total,
      page,
      pageSize,
      retentionDays: TRASH_RETENTION_DAYS,
    };
  });

  app.get(`/entries/trash/${entryIdPath}`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const entry = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id, deletedAt: { not: null } },
      include: entryInclude,
    });
    if (!entry) return sendError(reply, 404, "废纸篓中不存在", "NOT_FOUND");
    if (!(await requireLifeAccess(req, reply, entry.domain))) return;
    return serializeEntry(
      { ...entry, stocks: await enrichStocks(entry.stocks) },
      true
    );
  });

  app.post(`/entries/trash/${entryIdPath}/restore`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id, deletedAt: { not: null } },
    });
    if (!existing) return sendError(reply, 404, "废纸篓中不存在", "NOT_FOUND");
    if (!(await requireLifeAccess(req, reply, existing.domain))) return;
    const entry = await prisma.diaryEntry.update({
      where: { id },
      data: { deletedAt: null },
      include: entryInclude,
    });
    return serializeEntry(
      { ...entry, stocks: await enrichStocks(entry.stocks) },
      true
    );
  });

  app.delete(`/entries/trash/${entryIdPath}`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id, deletedAt: { not: null } },
    });
    if (!existing) return sendError(reply, 404, "废纸篓中不存在", "NOT_FOUND");
    if (!(await requireLifeAccess(req, reply, existing.domain))) return;
    await prisma.diaryEntry.delete({ where: { id } });
    return { ok: true };
  });

  // --- 正常日记 ---
  app.get("/entries", async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    const domain = parseDomain(q.domain);
    if (!domain) {
      return sendError(reply, 400, "请指定 domain：stock / reading / life", "VALIDATION_ERROR");
    }
    if (!(await requireLifeAccess(req, reply, domain))) return;
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));
    const where: Prisma.DiaryEntryWhereInput = {
      userId: req.user.id,
      domain,
      ...activeOnly,
    };
    if (q.from || q.to) {
      where.entryDate = {};
      if (q.from) where.entryDate.gte = parseDateOnly(q.from);
      if (q.to) where.entryDate.lte = parseDateOnly(q.to);
    }
    const keyword = (q.q || q.keyword || "").trim();

    if (domain === "stock") {
      if (q.category === "review" || q.category === "mindset") {
        where.category = q.category;
      }
      if (q.category === "mindset") {
        if (keyword) where.searchText = { contains: keyword };
      } else if (q.stockCode) {
        const filter = await resolveStockFilter(prisma, q.stockCode);
        if (filter.codes.length === 0 && !filter.nameContains) {
          where.stocks = { some: { code: "__none__" } };
        } else if (filter.nameContains) {
          where.stocks = {
            some: {
              OR: [
                ...(filter.codes.length
                  ? [{ code: { in: filter.codes } }]
                  : []),
                { name: { contains: filter.nameContains } },
              ],
            },
          };
        } else {
          where.stocks = { some: { code: { in: filter.codes } } };
        }
      } else if (keyword) {
        where.searchText = { contains: keyword };
      }
    } else if (domain === "reading") {
      if (q.bookTitle?.trim()) {
        where.books = { some: { title: { contains: q.bookTitle.trim() } } };
      }
      if (keyword) where.searchText = { contains: keyword };
    } else if (keyword) {
      where.searchText = { contains: keyword };
    }
    if (q.tag) where.tag = q.tag;

    const [total, items] = await Promise.all([
      prisma.diaryEntry.count({ where }),
      prisma.diaryEntry.findMany({
        where,
        include: entryInclude,
        orderBy: [
          { pinned: "desc" },
          { pinnedAt: "desc" },
          { entryDate: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: await Promise.all(
        items.map(async (e) =>
          serializeEntry({ ...e, stocks: await enrichStocks(e.stocks) })
        )
      ),
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
    const validated = validateEntryBody(parsed.data);
    if (!validated.ok) {
      return sendError(reply, 400, validated.message, "VALIDATION_ERROR");
    }
    const data = validated.data;
    const domain = validated.domain;
    if (!(await requireLifeAccess(req, reply, domain))) return;
    const content = (data.content ?? {
      type: "doc",
      content: [],
    }) as Prisma.InputJsonValue;
    const stocks =
      domain === "stock" ? await resolveStocks(data.stocks ?? [], content) : [];
    const write = buildEntryWriteData(
      domain,
      data,
      content,
      stocks,
      validated.tag,
      validated.location,
      validated.moodScore
    );
    const entry = await prisma.diaryEntry.create({
      data: {
        userId: req.user.id,
        title: write.title,
        entryDate: write.entryDate,
        domain: write.domain,
        category: write.category,
        tag: write.tag,
        location: toPrismaJsonField(write.location),
        searchText: write.searchText,
        pnlDay: write.pnlDay,
        pnlTotal: write.pnlTotal,
        mood: write.mood,
        moodScore: write.moodScore,
        content: write.content,
        marketSnapshot: write.marketSnapshot ?? undefined,
        stocks: { create: stocks },
        ...(validated.books.length > 0
          ? { books: { create: validated.books } }
          : {}),
      },
      include: entryInclude,
    });
    return reply.status(201).send(
      serializeEntry(
        { ...entry, stocks: await enrichStocks(entry.stocks) },
        true
      )
    );
  });

  app.get(`/entries/${entryIdPath}`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const entry = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id, ...activeOnly },
      include: entryInclude,
    });
    if (!entry) return sendError(reply, 404, "日记不存在", "NOT_FOUND");
    if (!(await requireLifeAccess(req, reply, entry.domain))) return;
    return serializeEntry(
      { ...entry, stocks: await enrichStocks(entry.stocks) },
      true
    );
  });

  app.patch(`/entries/${entryIdPath}`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id, ...activeOnly },
      include: entryInclude,
    });
    if (!existing) return sendError(reply, 404, "日记不存在", "NOT_FOUND");
    if (!(await requireLifeAccess(req, reply, existing.domain))) return;
    const parsed = entryBodySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(reply, 400, "参数校验失败", "VALIDATION_ERROR");
    }
    const merged: ParsedEntryBody = {
      domain: normalizeDomain(existing.domain),
      title: parsed.data.title ?? existing.title,
      entryDate:
        parsed.data.entryDate ?? formatDate(existing.entryDate),
      category:
        (parsed.data.category as "review" | "mindset" | undefined) ??
        (existing.category === "mindset" ? "mindset" : "review"),
      stocks: parsed.data.stocks ?? [],
      books:
        parsed.data.books !== undefined
          ? parsed.data.books
          : existing.books.map((b) => ({ title: b.title })),
      pnlDay:
        parsed.data.pnlDay !== undefined
          ? parsed.data.pnlDay
          : existing.pnlDay == null
            ? null
            : Number(existing.pnlDay),
      pnlTotal:
        parsed.data.pnlTotal !== undefined
          ? parsed.data.pnlTotal
          : existing.pnlTotal == null
            ? null
            : Number(existing.pnlTotal),
      mood:
        parsed.data.mood !== undefined ? parsed.data.mood : existing.mood,
      moodScore:
        parsed.data.moodScore !== undefined
          ? parsed.data.moodScore
          : existing.moodScore,
      tag: parsed.data.tag !== undefined ? parsed.data.tag : existing.tag,
      location:
        parsed.data.location !== undefined
          ? parsed.data.location
          : (existing.location as ParsedEntryBody["location"]),
      marketSnapshot:
        parsed.data.marketSnapshot !== undefined
          ? parsed.data.marketSnapshot
          : existing.marketSnapshot,
      content:
        parsed.data.content !== undefined
          ? parsed.data.content
          : existing.content,
    };
    const validated = validateEntryBody(merged, existing.domain);
    if (!validated.ok) {
      return sendError(reply, 400, validated.message, "VALIDATION_ERROR");
    }
    const data = validated.data;
    const domain = validated.domain;
    const content = (data.content ?? {
      type: "doc",
      content: [],
    }) as Prisma.InputJsonValue;
    const stocks =
      domain === "stock"
        ? await resolveStocks(data.stocks ?? [], content)
        : [];
    const write = buildEntryWriteData(
      domain,
      data,
      content,
      stocks,
      validated.tag,
      validated.location,
      validated.moodScore
    );
    const entry = await prisma.$transaction(async (tx) => {
      await tx.diaryStock.deleteMany({ where: { entryId: id } });
      await tx.diaryBook.deleteMany({ where: { entryId: id } });
      return tx.diaryEntry.update({
        where: { id },
        data: {
          title: write.title,
          entryDate: write.entryDate,
          category: write.category,
          tag: write.tag,
          location: toPrismaJsonField(write.location),
          searchText: write.searchText,
          pnlDay: write.pnlDay,
          pnlTotal: write.pnlTotal,
          mood: write.mood,
          moodScore: write.moodScore,
          marketSnapshot: write.marketSnapshot ?? null,
          content: write.content,
          ...(stocks.length > 0 ? { stocks: { create: stocks } } : {}),
          ...(validated.books.length > 0
            ? { books: { create: validated.books } }
            : {}),
        },
        include: entryInclude,
      });
    });
    return serializeEntry(
      { ...entry, stocks: await enrichStocks(entry.stocks) },
      true
    );
  });

  /** 置顶 / 取消置顶 */
  app.post(`/entries/${entryIdPath}/pin`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { pinned?: boolean };
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id, ...activeOnly },
    });
    if (!existing) return sendError(reply, 404, "日记不存在", "NOT_FOUND");
    if (!(await requireLifeAccess(req, reply, existing.domain))) return;
    const pinned =
      typeof body.pinned === "boolean" ? body.pinned : !existing.pinned;
    const entry = await prisma.diaryEntry.update({
      where: { id },
      data: {
        pinned,
        pinnedAt: pinned ? new Date() : null,
      },
      include: entryInclude,
    });
    return serializeEntry(
      { ...entry, stocks: await enrichStocks(entry.stocks) },
      true
    );
  });

  /** 移至废纸篓（软删除） */
  app.delete(`/entries/${entryIdPath}`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: req.user.id, ...activeOnly },
    });
    if (!existing) return sendError(reply, 404, "日记不存在", "NOT_FOUND");
    if (!(await requireLifeAccess(req, reply, existing.domain))) return;
    const entry = await prisma.diaryEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: entryInclude,
    });
    return {
      ok: true,
      deletedAt: entry.deletedAt!.toISOString(),
      purgeAt: purgeAt(entry.deletedAt!),
    };
  });
}
