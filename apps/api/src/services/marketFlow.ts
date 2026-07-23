const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const UT = "7eea3edcaed734bea9cbfc24409ed989";

async function fetchJson(url: string, referer: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: referer },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const exec = promisify(execFile);
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

/** 东方财富 push2his：上证 + 深证 主力净流入之和（与同花顺口径接近，单位：亿） */
export async function fetchMainCapitalInflowFromEastMoney(
  tradeDate?: string
): Promise<number | null> {
  try {
    let totalYuan = 0;
    let found = 0;
    for (const secid of ["1.000001", "0.399001"] as const) {
      const url =
        "https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get" +
        `?lmt=10&klt=101&secid=${secid}&fields1=f1&fields2=f51,f52&ut=${UT}`;
      const raw = (await fetchJson(url, "https://data.eastmoney.com/")) as {
        data?: { klines?: string[] };
      };
      const lines = raw.data?.klines ?? [];
      const line = tradeDate
        ? lines.find((l) => l.startsWith(`${tradeDate},`))
        : lines.at(-1);
      if (!line) continue;
      found += 1;
      totalYuan += Number(line.split(",")[1]) || 0;
    }
    if (found === 0) return null;
    return Math.round((totalYuan / 1e8) * 100) / 100;
  } catch {
    return null;
  }
}
