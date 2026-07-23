export type MarketIndex = {
  id: string;
  name: string;
  point: number;
  changeAmt: number;
  changePct: number;
};

export type MarketSnapshot = {
  date: string;
  tradeDate?: string;
  snapshotType: "intraday" | "close";
  snapshotAt: string;
  indices: MarketIndex[];
  breadth: { rise: number; fall: number };
  turnover: number;
  capitalInflow: number;
  available: boolean;
  message?: string;
};

const INDEX_DEFS = [
  { secid: "1.000001", id: "sh000001", name: "上证指数" },
  { secid: "0.399001", id: "sz399001", name: "深证成指" },
  { secid: "0.399006", id: "sz399006", name: "创业板指" },
  { secid: "1.000688", id: "sh000688", name: "科创50" },
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

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; StockDiary/1.0; +local)",
        Referer: "https://quote.eastmoney.com/",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchIndices(): Promise<MarketIndex[]> {
  const secids = INDEX_DEFS.map((d) => d.secid).join(",");
  const url =
    `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f12,f14,f2,f3,f4&secids=${secids}`;
  const raw = (await fetchJson(url)) as {
    data?: { diff?: Array<Record<string, unknown>> };
  };
  const diff = raw.data?.diff ?? [];
  const byCode = new Map(
    diff.map((row) => [String(row.f12), row] as const)
  );

  return INDEX_DEFS.map((def) => {
    const code = def.secid.split(".")[1];
    const row = byCode.get(code);
    const point = num(row?.f2);
    const changePct = num(row?.f3);
    const changeAmt = num(row?.f4);
    return {
      id: def.id,
      name: def.name,
      point,
      changeAmt,
      changePct,
    };
  });
}

async function fetchBreadthTurnover(): Promise<{
  rise: number;
  fall: number;
  turnover: number;
}> {
  // 沪深京市场统计（东方财富）
  const url =
    "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f104,f105,f106,f46,f12&secids=1.000001";
  try {
    // 备用：全市场涨跌家数
    const statsUrl =
      "https://push2ex.eastmoney.com/getTopicZDFenBu?ut=7eea3edcaed734bea9cbfc24409ed989";
    const raw = (await fetchJson(statsUrl)) as {
      data?: { zdfb?: Array<{ t: number; z: number }> };
    };
    const zdfb = raw.data?.zdfb ?? [];
    let rise = 0;
    let fall = 0;
    for (const item of zdfb) {
      if (item.t > 0) rise += item.z;
      else if (item.t < 0) fall += item.z;
    }
    // 成交额：取上证指数附带字段近似（亿元）——再拉一次成交额接口
    const amtUrl =
      "https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fields=f48,f6";
    const amtRaw = (await fetchJson(amtUrl)) as {
      data?: { f48?: number; f6?: number };
    };
    // f6 成交额（元），转亿元
    const turnoverYuan = num(amtRaw.data?.f6);
    const turnover = Math.round((turnoverYuan / 1e8) * 100) / 100;
    void url;
    return { rise, fall, turnover: turnover || 0 };
  } catch {
    return { rise: 0, fall: 0, turnover: 0 };
  }
}

async function fetchCapitalInflow(): Promise<number> {
  try {
    // 大盘资金流（亿元）
    const url =
      "https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?lmt=1&klt=101&secid=1.000001&fields1=f1&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65";
    const raw = (await fetchJson(url)) as {
      data?: { klines?: string[] };
    };
    const last = raw.data?.klines?.at(-1);
    if (!last) return 0;
    // 格式: date,主力净流入,...
    const parts = last.split(",");
    const inflowWan = num(parts[1]);
    return Math.round((inflowWan / 10000) * 100) / 100;
  } catch {
    return 0;
  }
}

export async function getMarketSnapshot(date: string): Promise<MarketSnapshot> {
  const snapshotType = decideSnapshotType(date);
  const snapshotAt = new Date().toISOString();

  try {
    const [indices, breadth, capitalInflow] = await Promise.all([
      fetchIndices(),
      fetchBreadthTurnover(),
      fetchCapitalInflow(),
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
        message: "行情暂不可用",
      };
    }

    return {
      date,
      tradeDate: date,
      snapshotType,
      snapshotAt,
      indices,
      breadth: { rise: breadth.rise, fall: breadth.fall },
      turnover: breadth.turnover,
      capitalInflow,
      available: true,
    };
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
    };
  }
}
