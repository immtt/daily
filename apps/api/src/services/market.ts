import {
  fetchIndicesFromEastMoney,
  fetchIndicesFromSina,
} from "./marketProviders.js";
import { fetchEastMoneyJson } from "./eastmoney.js";
import { fetchMainCapitalInflowFromEastMoney } from "./marketFlow.js";
import { fetchMarketStatsFromSina } from "./marketStats.js";
import type { MarketIndex, MarketSnapshot } from "./marketTypes.js";
import {
  attachTurnoverCompare,
  compareTurnover,
  findCompleteCloseSnapshot,
  findPreviousCompleteCloseSnapshot,
  isCompleteCloseSnapshot,
  upsertCloseSnapshot,
  storedToMarketSnapshot,
} from "./marketSnapshotStore.js";
import { ensurePreviousCompleteCloseSnapshot } from "./marketBackfill.js";

export type { MarketIndex, MarketSnapshot, TurnoverVsPrev } from "./marketTypes.js";

const INDEX_DEFS = [
  { id: "sh000001", name: "上证指数" },
  { id: "sz399001", name: "深证成指" },
  { id: "sz399006", name: "创业板指" },
  { id: "sh000688", name: "科创50" },
] as const;

function todayCN(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function nowHourCN(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "hour")?.value ?? 0);
}

function decideSnapshotType(date: string): "intraday" | "close" {
  if (date === todayCN() && nowHourCN() < 15) return "intraday";
  return "close";
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchIndices(): Promise<{ indices: MarketIndex[]; source: string }> {
  const fromEm = await fetchIndicesFromEastMoney();
  if (fromEm?.some((i) => i.point > 0)) {
    return { indices: fromEm, source: "eastmoney" };
  }
  const fromSina = await fetchIndicesFromSina();
  if (fromSina.some((i) => i.point > 0)) {
    return { indices: fromSina, source: "sina" };
  }
  return {
    indices: INDEX_DEFS.map((d) => ({
      id: d.id,
      name: d.name,
      point: 0,
      changeAmt: 0,
      changePct: 0,
    })),
    source: "none",
  };
}

async function fetchExtrasFromEastMoney(): Promise<{
  rise: number;
  fall: number;
  turnover: number;
  capitalInflow: number;
} | null> {
  try {
    const statsUrl =
      "https://push2ex.eastmoney.com/getTopicZDFenBu?ut=7eea3edcaed734bea9cbfc24409ed989";
    const raw = (await fetchEastMoneyJson(statsUrl)) as {
      data?: { zdfb?: Array<{ t: number; z: number }> };
    };
    const zdfb = raw.data?.zdfb ?? [];
    let rise = 0;
    let fall = 0;
    for (const item of zdfb) {
      if (item.t > 0) rise += item.z;
      else if (item.t < 0) fall += item.z;
    }
    const amtRaw = (await fetchEastMoneyJson(
      "https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fields=f48,f6"
    )) as { data?: { f6?: number } };
    const turnover = Math.round((num(amtRaw.data?.f6) / 1e8) * 100) / 100;

    let capitalInflow = 0;
    const emMain = await fetchMainCapitalInflowFromEastMoney();
    if (emMain != null) {
      capitalInflow = emMain;
    } else {
      const flowRaw = (await fetchEastMoneyJson(
        "https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?lmt=1&klt=101&secid=1.000001&fields1=f1&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65"
      )) as { data?: { klines?: string[] } };
      const last = flowRaw.data?.klines?.at(-1);
      if (last) {
        capitalInflow =
          Math.round((num(last.split(",")[1]) / 10000) * 100) / 100;
      }
    }

    if (rise > 0 || fall > 0 || turnover > 0 || capitalInflow !== 0) {
      return { rise, fall, turnover, capitalInflow };
    }
  } catch {
    // fallback below
  }
  return null;
}

async function fetchExtras(): Promise<{
  rise: number;
  fall: number;
  turnover: number;
  capitalInflow: number;
}> {
  const em = await fetchExtrasFromEastMoney();
  if (em) return em;
  try {
    const sina = await fetchMarketStatsFromSina();
    return sina;
  } catch {
    return { rise: 0, fall: 0, turnover: 0, capitalInflow: 0 };
  }
}

export async function getMarketSnapshot(date: string): Promise<MarketSnapshot> {
  const snapshotType = decideSnapshotType(date);
  const snapshotAt = new Date().toISOString();
  const isToday = date === todayCN();

  try {
    if (snapshotType === "close") {
      const cached = await findCompleteCloseSnapshot(date);
      if (cached) {
        await ensurePreviousCompleteCloseSnapshot(date);
        const prev = await findPreviousCompleteCloseSnapshot(date);
        const snap = storedToMarketSnapshot(cached, date);
        return attachTurnoverCompare(snap, compareTurnover(snap.turnover, prev));
      }
    }

    // 历史收盘日：库中无完整快照时不调用「今日实时」接口
    if (!isToday && snapshotType === "close") {
      return {
        date,
        snapshotType,
        snapshotAt,
        indices: INDEX_DEFS.map((d) => ({
          id: d.id,
          name: d.name,
          point: 0,
          changeAmt: 0,
          changePct: 0,
        })),
        breadth: { rise: 0, fall: 0 },
        turnover: 0,
        capitalInflow: 0,
        available: false,
        message: "该日收盘快照尚未入库，请稍后再试",
        source: "db-miss",
        snapshotComplete: false,
      };
    }

    const [{ indices, source }, extras] = await Promise.all([
      fetchIndices(),
      fetchExtras(),
    ]);

    const allZero = indices.every((i) => i.point === 0);
    if (allZero) {
      return {
        date,
        snapshotType,
        snapshotAt,
        indices,
        breadth: { rise: 0, fall: 0 },
        turnover: 0,
        capitalInflow: 0,
        available: false,
        message: "行情暂不可用，请检查网络后重试",
        source,
        snapshotComplete: false,
      };
    }

    const snap: MarketSnapshot = {
      date,
      tradeDate: date,
      snapshotType,
      snapshotAt,
      indices,
      breadth: { rise: extras.rise, fall: extras.fall },
      turnover: extras.turnover,
      capitalInflow: extras.capitalInflow,
      available: true,
      source,
      snapshotComplete: isCompleteCloseSnapshot({
        snapshotType,
        available: true,
        indices,
        breadth: { rise: extras.rise, fall: extras.fall },
        turnover: extras.turnover,
      }),
    };

    if (snapshotType === "close") {
      await upsertCloseSnapshot(snap, snap.snapshotComplete === true);
    }

    await ensurePreviousCompleteCloseSnapshot(date);
    const prev = await findPreviousCompleteCloseSnapshot(date);
    return attachTurnoverCompare(snap, compareTurnover(snap.turnover, prev));
  } catch {
    return {
      date,
      snapshotType,
      snapshotAt,
      indices: INDEX_DEFS.map((d) => ({
        id: d.id,
        name: d.name,
        point: 0,
        changeAmt: 0,
        changePct: 0,
      })),
      breadth: { rise: 0, fall: 0 },
      turnover: 0,
      capitalInflow: 0,
      available: false,
      message: "行情暂不可用，不影响保存日记",
      source: "none",
      snapshotComplete: false,
    };
  }
}
