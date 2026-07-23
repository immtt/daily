const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchEastMoneyJson(url: string): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": UA,
          Referer: "https://quote.eastmoney.com/",
          Accept: "application/json, text/plain, */*",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trim()) throw new Error("empty body");
      return JSON.parse(text) as unknown;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

export function inferMarket(code: string): string {
  if (/^(688|689|60|601|603|605|11)/.test(code)) return "SH";
  if (/^(8|4|92)/.test(code)) return "BJ";
  return "SZ";
}

export type EastMoneyStockRow = { code: string; name: string; market: string };

/** 从东方财富生产接口拉取 A 股代码库（分页） */
async function fetchAllFromEastMoney(): Promise<EastMoneyStockRow[]> {
  const fs = encodeURIComponent("m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23");
  const pageSize = 100;
  const rows: EastMoneyStockRow[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total) {
    const url =
      `https://push2.eastmoney.com/api/qt/clist/get?pn=${page}&pz=${pageSize}` +
      `&po=1&np=1&fltt=2&invt=2&fid=f12&fs=${fs}&fields=f12,f14`;
    const raw = (await fetchEastMoneyJson(url)) as {
      data?: { total?: number; diff?: Array<{ f12?: unknown; f14?: unknown }> };
    };
    total = raw.data?.total ?? rows.length;
    const diff = raw.data?.diff ?? [];
    if (diff.length === 0) break;
    for (const item of diff) {
      const code = String(item.f12 ?? "").trim();
      const name = String(item.f14 ?? "").trim();
      if (!code || !name) continue;
      rows.push({ code, name, market: inferMarket(code) });
    }
    if (diff.length < pageSize) break;
    page += 1;
    await new Promise((r) => setTimeout(r, 120));
  }

  return rows;
}

/** 新浪财经 A 股列表（生产备用接口） */
async function fetchAllFromSina(): Promise<EastMoneyStockRow[]> {
  const pageSize = 100;
  const rows: EastMoneyStockRow[] = [];
  let page = 1;

  while (true) {
    const url =
      "https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/" +
      `Market_Center.getHQNodeData?page=${page}&num=${pageSize}&sort=symbol&asc=1&node=hs_a`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Referer: "https://finance.sina.com.cn/",
      },
    });
    if (!res.ok) throw new Error(`Sina HTTP ${res.status}`);
    const data = (await res.json()) as Array<{ code?: string; name?: string }>;
    if (!Array.isArray(data) || data.length === 0) break;
    for (const item of data) {
      const code = String(item.code ?? "").trim();
      const name = String(item.name ?? "").trim();
      if (!code || !name) continue;
      rows.push({ code, name, market: inferMarket(code) });
    }
    if (data.length < pageSize) break;
    page += 1;
    await new Promise((r) => setTimeout(r, 100));
  }

  return rows;
}

export async function fetchAllAShareCatalog(): Promise<EastMoneyStockRow[]> {
  try {
    const em = await fetchAllFromEastMoney();
    if (em.length > 0) return em;
  } catch {
    // 东方财富不可用时走新浪
  }
  const sina = await fetchAllFromSina();
  if (sina.length > 0) return sina;
  throw new Error("无法从东方财富或新浪获取股票列表");
}
