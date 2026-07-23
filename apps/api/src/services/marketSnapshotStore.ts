import { prisma } from "../lib/prisma.js";
import type { MarketIndex, MarketSnapshot } from "./marketTypes.js";

export type StoredCloseSnapshot = {
  tradeDate: string;
  snapshotKind: "close";
  isComplete: boolean;
  indices: MarketIndex[];
  breadth: { rise: number; fall: number };
  turnover: number;
  capitalInflow: number;
  source?: string;
  capturedAt: string;
};

function rowToStored(row: {
  tradeDate: string;
  snapshotKind: string;
  isComplete: boolean;
  indices: unknown;
  breadthRise: number;
  breadthFall: number;
  turnover: unknown;
  capitalInflow: unknown;
  source: string | null;
  capturedAt: Date;
}): StoredCloseSnapshot {
  return {
    tradeDate: row.tradeDate,
    snapshotKind: "close",
    isComplete: row.isComplete,
    indices: row.indices as MarketIndex[],
    breadth: { rise: row.breadthRise, fall: row.breadthFall },
    turnover: Number(row.turnover),
    capitalInflow: Number(row.capitalInflow),
    source: row.source ?? undefined,
    capturedAt: row.capturedAt.toISOString(),
  };
}

export function isCompleteCloseSnapshot(input: {
  snapshotType: "intraday" | "close";
  available: boolean;
  indices: MarketIndex[];
  breadth: { rise: number; fall: number };
  turnover: number;
}): boolean {
  if (input.snapshotType !== "close" || !input.available) return false;
  if (input.turnover <= 0) return false;
  if (!input.indices.some((i) => i.point > 0)) return false;
  return true;
}

export async function findCompleteCloseSnapshot(
  tradeDate: string
): Promise<StoredCloseSnapshot | null> {
  const row = await prisma.marketDailySnapshot.findFirst({
    where: { tradeDate, snapshotKind: "close", isComplete: true },
  });
  return row ? rowToStored(row) : null;
}

/** 上一完整收盘日（严格早于 tradeDate） */
export async function findPreviousCompleteCloseSnapshot(
  tradeDate: string
): Promise<StoredCloseSnapshot | null> {
  const row = await prisma.marketDailySnapshot.findFirst({
    where: {
      tradeDate: { lt: tradeDate },
      snapshotKind: "close",
      isComplete: true,
    },
    orderBy: { tradeDate: "desc" },
  });
  return row ? rowToStored(row) : null;
}

export async function upsertCloseSnapshot(
  snap: MarketSnapshot,
  isComplete: boolean
): Promise<void> {
  if (snap.snapshotType !== "close") return;

  await prisma.marketDailySnapshot.upsert({
    where: { tradeDate: snap.date },
    create: {
      tradeDate: snap.date,
      snapshotKind: "close",
      isComplete,
      indices: snap.indices,
      breadthRise: snap.breadth.rise,
      breadthFall: snap.breadth.fall,
      turnover: snap.turnover,
      capitalInflow: snap.capitalInflow,
      source: snap.source ?? null,
      capturedAt: new Date(snap.snapshotAt),
    },
    update: {
      ...(isComplete ? { isComplete: true } : {}),
      indices: snap.indices,
      breadthRise: snap.breadth.rise,
      breadthFall: snap.breadth.fall,
      turnover: snap.turnover,
      capitalInflow: snap.capitalInflow,
      source: snap.source ?? null,
      capturedAt: new Date(snap.snapshotAt),
    },
  });
}

export function storedToMarketSnapshot(
  stored: StoredCloseSnapshot,
  date: string
): MarketSnapshot {
  return {
    date,
    tradeDate: stored.tradeDate,
    snapshotType: "close",
    snapshotAt: stored.capturedAt,
    indices: stored.indices,
    breadth: stored.breadth,
    turnover: stored.turnover,
    capitalInflow: stored.capitalInflow,
    available: true,
    source: stored.source ? `${stored.source}+db` : "db",
    snapshotComplete: true,
  };
}

export type TurnoverCompare = {
  prevTradeDate: string | null;
  prevTurnover: number | null;
  turnoverVsPrev: "up" | "down" | "flat" | null;
  turnoverChangeAmt: number | null;
  turnoverChangePct: number | null;
};

export function compareTurnover(
  turnover: number,
  prev: StoredCloseSnapshot | null
): TurnoverCompare {
  if (!prev || prev.turnover <= 0 || turnover <= 0) {
    return {
      prevTradeDate: prev?.tradeDate ?? null,
      prevTurnover: prev?.turnover ?? null,
      turnoverVsPrev: null,
      turnoverChangeAmt: null,
      turnoverChangePct: null,
    };
  }

  const delta = turnover - prev.turnover;
  const changeAmt = Math.round(Math.abs(delta) * 100) / 100;
  const pct = Math.round((delta / prev.turnover) * 10000) / 100;
  let turnoverVsPrev: "up" | "down" | "flat" = "flat";
  if (delta > 0) turnoverVsPrev = "up";
  else if (delta < 0) turnoverVsPrev = "down";

  return {
    prevTradeDate: prev.tradeDate,
    prevTurnover: prev.turnover,
    turnoverVsPrev,
    turnoverChangeAmt: changeAmt,
    turnoverChangePct: pct,
  };
}

export function attachTurnoverCompare(
  snap: MarketSnapshot,
  cmp: TurnoverCompare
): MarketSnapshot {
  return {
    ...snap,
    prevTradeDate: cmp.prevTradeDate,
    prevTurnover: cmp.prevTurnover,
    turnoverVsPrev: cmp.turnoverVsPrev,
    turnoverChangeAmt: cmp.turnoverChangeAmt,
    turnoverChangePct: cmp.turnoverChangePct,
  };
}
