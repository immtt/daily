import type { MarketIndex } from "./market.js";

const SINA_INDEX = [
  { key: "s_sh000001", id: "sh000001", name: "上证指数" },
  { key: "s_sz399001", id: "sz399001", name: "深证成指" },
  { key: "s_sz399006", id: "sz399006", name: "创业板指" },
  { key: "s_sh000688", id: "sh000688", name: "科创50" },
] as const;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const EM_INDEX = [
  { secid: "1.000001", id: "sh000001", name: "上证指数" },
  { secid: "0.399001", id: "sz399001", name: "深证成指" },
  { secid: "0.399006", id: "sz399006", name: "创业板指" },
  { secid: "1.000688", id: "sh000688", name: "科创50" },
] as const;

async function fetchIndexFromEastMoney(
  secid: string,
  id: string,
  name: string
): Promise<MarketIndex | null> {
  const url =
    `https://push2.eastmoney.com/api/qt/stock/get?invt=2&fltt=2` +
    `&fields=f43,f169,f170&secid=${secid}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Referer: "https://quote.eastmoney.com/",
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    const raw = JSON.parse(text) as { data?: Record<string, unknown> };
    const point = num(raw.data?.f43) / 100 || num(raw.data?.f169);
    const changePct = num(raw.data?.f170) / 100;
    const changeAmt =
      point && changePct
        ? Math.round(((point * changePct) / 100) * 100) / 100
        : 0;
    if (!point) return null;
    return { id, name, point, changeAmt, changePct };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchIndicesFromEastMoney(): Promise<MarketIndex[] | null> {
  const items = await Promise.all(
    EM_INDEX.map((d) => fetchIndexFromEastMoney(d.secid, d.id, d.name))
  );
  const ok = items.filter((x): x is MarketIndex => x != null);
  return ok.length > 0 ? ok : null;
}

export async function fetchIndicesFromSina(): Promise<MarketIndex[]> {
  const list = SINA_INDEX.map((d) => d.key).join(",");
  const res = await fetch(`https://hq.sinajs.cn/list=${list}`, {
    headers: {
      "User-Agent": UA,
      Referer: "https://finance.sina.com.cn/",
    },
  });
  if (!res.ok) throw new Error(`Sina HTTP ${res.status}`);
  const text = await res.text();
  const byKey = new Map<string, string>();
  for (const line of text.split(";")) {
    const m = line.match(/hq_str_(\w+)="([^"]*)"/);
    if (m) byKey.set(m[1], m[2]);
  }
  return SINA_INDEX.map((def) => {
    const payload = byKey.get(def.key) ?? "";
    const parts = payload.split(",");
    return {
      id: def.id,
      name: def.name,
      point: num(parts[1]),
      changeAmt: num(parts[2]),
      changePct: num(parts[3]),
    };
  });
}
