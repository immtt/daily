import { execFile } from "child_process";
import { promisify } from "util";
import type { MarketIndex, MarketSnapshot } from "./marketTypes.js";
import {
  findCompleteCloseSnapshot,
  isCompleteCloseSnapshot,
  upsertCloseSnapshot,
} from "./marketSnapshotStore.js";
import { fetchMarketStatsFromSina } from "./marketStats.js";
import { fetchMainCapitalInflowFromEastMoney } from "./marketFlow.js";

const exec = promisify(execFile);
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const INDEX_SYMBOLS = [
  { symbol: "sh000001", id: "sh000001", name: "上证指数" },
  { symbol: "sz399001", id: "sz399001", name: "深证成指" },
  { symbol: "sz399006", id: "sz399006", name: "创业板指" },
  { symbol: "sh000688", id: "sh000688", name: "科创50" },
] as const;

export function prevTradingDay(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().slice(0, 10);
}

async function fetchJson(url: string, referer: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: referer },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const { stdout } = await exec("curl", [
      "-sS",
      "--max-time",
      "20",
      url,
      "-H",
      `User-Agent: ${UA}`,
      "-H",
      `Referer: ${referer}`,
    ]);
    return JSON.parse(stdout) as unknown;
  }
}

async function fetchIndicesForDate(tradeDate: string): Promise<MarketIndex[]> {
  const out: MarketIndex[] = [];
  for (const def of INDEX_SYMBOLS) {
    const url =
      "https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/" +
      `CN_MarketData.getKLineData?symbol=${def.symbol}&scale=240&ma=no&datalen=20`;
    const rows = (await fetchJson(url, "https://finance.sina.com.cn/")) as Array<{
      day?: string;
      open?: string;
      close?: string;
    }>;
    const row = rows.find((r) => r.day === tradeDate);
    if (!row?.close) continue;
    const close = Number(row.close);
    const open = Number(row.open ?? row.close);
    const changeAmt = Math.round((close - open) * 100) / 100;
    const changePct =
      open > 0 ? Math.round(((close - open) / open) * 10000) / 100 : 0;
    out.push({
      id: def.id,
      name: def.name,
      point: close,
      changeAmt,
      changePct,
    });
  }
  return out;
}

async function fetchTurnoverForDate(
  tradeDate: string,
  today: string
): Promise<number | null> {
  if (tradeDate === today) {
    const live = await fetchMarketStatsFromSina();
    return live.turnover > 0 ? live.turnover : null;
  }
  return null;
}

async function fetchBreadthForDate(
  tradeDate: string,
  today: string
): Promise<{ rise: number; fall: number } | null> {
  if (tradeDate !== today) return null;
  const live = await fetchMarketStatsFromSina();
  if (live.rise + live.fall < 100) return null;
  return { rise: live.rise, fall: live.fall };
}

export async function backfillCloseSnapshot(
  tradeDate: string,
  opts?: { turnover?: number; source?: string },
  today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
): Promise<boolean> {
  const existing = await findCompleteCloseSnapshot(tradeDate);
  if (existing) return true;

  const indices = await fetchIndicesForDate(tradeDate);
  if (!indices.length) return false;

  const turnover =
    opts?.turnover ?? (await fetchTurnoverForDate(tradeDate, today));
  if (!turnover || turnover <= 0) return false;

  const breadth = await fetchBreadthForDate(tradeDate, today);
  const capitalInflow = await fetchMainCapitalInflowFromEastMoney(tradeDate);

  const snap: MarketSnapshot = {
    date: tradeDate,
    tradeDate,
    snapshotType: "close",
    snapshotAt: new Date().toISOString(),
    indices,
    breadth: breadth ?? { rise: 0, fall: 0 },
    turnover,
    capitalInflow: capitalInflow ?? 0,
    available: true,
    source: opts?.source ?? "backfill",
  };

  const complete = isCompleteCloseSnapshot({
    snapshotType: "close",
    available: true,
    indices,
    breadth: snap.breadth,
    turnover,
  });

  await upsertCloseSnapshot(snap, complete);
  return complete;
}

/** 对比日前一日完整收盘快照；库中没有则尝试补库 */
export async function ensurePreviousCompleteCloseSnapshot(
  tradeDate: string
): Promise<void> {
  const prevDate = prevTradingDay(tradeDate);
  const prev = await findCompleteCloseSnapshot(prevDate);
  if (prev) return;

  const ok = await backfillCloseSnapshot(prevDate);
  if (ok) return;

  const current = await findCompleteCloseSnapshot(tradeDate);
  const delta = await fetchTurnoverDeltaDirect();
  if (current && delta != null && delta !== 0) {
    const prevTurnover = Math.round((current.turnover - delta) * 100) / 100;
    if (prevTurnover > 0) {
      await backfillCloseSnapshot(prevDate, {
        turnover: prevTurnover,
        source: "backfill-delta",
      });
    }
  }
}

/** 两市成交额较上一交易日变化（亿，负=缩量） */
async function fetchTurnoverDeltaDirect(): Promise<number | null> {
  try {
    const url =
      "https://push2.eastmoney.com/api/qt/stock/get" +
      "?secid=1.000001&fields=f161,f162,f163,f168,f169,f170,f171&ut=7eea3edcaed734bea9cbfc24409ed989";
    const raw = (await fetchJson(url, "https://quote.eastmoney.com/")) as {
      data?: Record<string, unknown>;
    };
    const d = raw.data;
    if (!d) return null;
    for (const key of ["f161", "f162", "f163", "f168", "f169", "f170", "f171"]) {
      const n = Number(d[key]);
      if (Number.isFinite(n) && Math.abs(n) > 1e7) {
        return Math.round((n / 1e8) * 100) / 100;
      }
    }
    return null;
  } catch {
    return null;
  }
}
