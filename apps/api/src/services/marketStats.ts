const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

import { fetchMainCapitalInflowFromEastMoney } from "./marketFlow.js";

export type MarketStats = {
  rise: number;
  fall: number;
  turnover: number;
  capitalInflow: number;
};

let cache: { at: number; stats: MarketStats } | null = null;
const CACHE_MS = 3 * 60 * 1000;

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://finance.sina.com.cn/" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<unknown>;
}

async function scanBreadthAndTurnover() {
  let rise = 0;
  let fall = 0;
  let turnoverYuan = 0;
  let page = 1;

  while (true) {
    const url =
      "https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/" +
      `Market_Center.getHQNodeData?page=${page}&num=100&sort=symbol&asc=1&node=hs_a`;
    const rows = (await fetchJson(url)) as Array<{
      changepercent?: number | string;
      amount?: number | string;
    }>;
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      const pct = Number(row.changepercent);
      if (pct > 0) rise += 1;
      else if (pct < 0) fall += 1;
      turnoverYuan += Number(row.amount) || 0;
    }

    if (rows.length < 100) break;
    page += 1;
  }

  return {
    rise,
    fall,
    turnover: Math.round((turnoverYuan / 1e8) * 100) / 100,
  };
}

async function scanCapitalInflow() {
  let netYuan = 0;
  let page = 1;

  while (true) {
    const url =
      "https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/" +
      `MoneyFlow.ssl_bkzj_ssggzj?page=${page}&num=100&sort=symbol&asc=1&bankuai=&shujuquanju=`;
    const rows = (await fetchJson(url)) as Array<{ netamount?: number | string }>;
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      netYuan += Number(row.netamount) || 0;
    }

    if (rows.length < 100) break;
    page += 1;
  }

  return Math.round((netYuan / 1e8) * 100) / 100;
}

/** 涨跌家数 / 成交额 / 资金净流入（新浪生产接口，带 3 分钟缓存） */
export async function fetchMarketStatsFromSina(): Promise<MarketStats> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.stats;
  }

  const [breadth, capitalInflow] = await Promise.all([
    scanBreadthAndTurnover(),
    fetchMainCapitalInflowFromEastMoney()
      .then((v) => v ?? scanCapitalInflow().catch(() => 0))
      .catch(() => scanCapitalInflow().catch(() => 0)),
  ]);

  const stats: MarketStats = {
    rise: breadth.rise,
    fall: breadth.fall,
    turnover: breadth.turnover,
    capitalInflow,
  };
  cache = { at: Date.now(), stats };
  return stats;
}
