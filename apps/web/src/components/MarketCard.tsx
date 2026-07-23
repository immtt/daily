import { useEffect, useState } from "react";
import { api, type MarketSnapshot } from "../api/client";

export function MarketCard({
  date,
  snapshot,
  onChange,
  editable = false,
}: {
  date: string;
  snapshot: MarketSnapshot | null;
  onChange?: (s: MarketSnapshot | null) => void;
  editable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<MarketSnapshot | null>(snapshot);

  useEffect(() => {
    setLocal(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (!editable || !date) return;
    let cancelled = false;
    setLoading(true);
    api
      .market(date)
      .then((s) => {
        if (cancelled) return;
        setLocal(s);
        onChange?.(s);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback: MarketSnapshot = {
          date,
          snapshotType: "close",
          snapshotAt: new Date().toISOString(),
          indices: [],
          breadth: { rise: 0, fall: 0 },
          turnover: 0,
          capitalInflow: 0,
          available: false,
          message: "行情暂不可用",
        };
        setLocal(fallback);
        onChange?.(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, editable, onChange]);

  const data = local;
  const turnoverChangeAmt = (() => {
    if (data?.turnoverChangeAmt != null) return data.turnoverChangeAmt;
    if (
      data?.turnoverVsPrev &&
      data.turnoverVsPrev !== "flat" &&
      data.prevTurnover != null &&
      data.turnover > 0
    ) {
      return Math.round(Math.abs(data.turnover - data.prevTurnover) * 100) / 100;
    }
    return null;
  })();
  const summary = (() => {
    if (loading) return "加载中…";
    if (!data || !data.available) return data?.message || "行情暂不可用";
    const sh = data.indices.find((i) => i.id === "sh000001") || data.indices[0];
    if (!sh) return "暂无指数";
    const sign = sh.changePct > 0 ? "+" : "";
    const tag = data.snapshotType === "intraday" ? "盘中" : "收盘";
    return `${sh.name} ${sh.point.toFixed(2)} ${sign}${sh.changePct.toFixed(2)}% · ${tag}`;
  })();

  return (
    <section className="market-card">
      <button
        type="button"
        className="market-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`chevron ${open ? "open" : ""}`}>▶</span>
        <span className="market-label">大盘概况</span>
        <span className="market-summary">{summary}</span>
      </button>
      {open && data && (
        <div className="market-body">
          {!data.available ? (
            <p className="muted">{data.message || "行情暂不可用"}</p>
          ) : (
            <>
              <div className="index-grid">
                {data.indices.map((idx) => (
                  <div key={idx.id} className="index-item">
                    <div className="index-name">{idx.name}</div>
                    <div className="index-point">{idx.point.toFixed(2)}</div>
                    <div
                      className={`index-chg ${idx.changePct >= 0 ? "up" : "down"}`}
                    >
                      {idx.changePct >= 0 ? "+" : ""}
                      {idx.changePct.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="market-meta">
                <span>
                  涨跌家数{" "}
                  <b className="up">{data.breadth.rise}</b> /{" "}
                  <b className="down">{data.breadth.fall}</b>
                </span>
                <span className="market-turnover-row">
                  成交额 <b>{data.turnover}</b> 亿
                  {data.turnoverVsPrev && (
                    <span
                      className={`turnover-vs-prev ${data.turnoverVsPrev === "up" ? "up" : data.turnoverVsPrev === "down" ? "down" : "muted"}`}
                      title={
                        data.prevTradeDate && data.prevTurnover != null
                          ? `上一交易日 ${data.prevTradeDate} 成交额 ${data.prevTurnover} 亿${
                              data.turnoverChangePct != null
                                ? `（${data.turnoverChangePct > 0 ? "+" : ""}${data.turnoverChangePct}%）`
                                : ""
                            }`
                          : undefined
                      }
                    >
                      较上一日{data.turnoverVsPrev === "up" ? "增量" : data.turnoverVsPrev === "down" ? "缩量" : "持平"}
                      {data.turnoverVsPrev !== "flat" &&
                        turnoverChangeAmt != null &&
                        ` ${turnoverChangeAmt} 亿`}
                    </span>
                  )}
                  {data.snapshotType === "intraday" && !data.snapshotComplete && (
                    <span className="turnover-tag intraday">盘中</span>
                  )}
                </span>
                <span>
                  主力净流入{" "}
                  <b className={data.capitalInflow >= 0 ? "up" : "down"}>
                    {data.capitalInflow >= 0 ? "+" : ""}
                    {data.capitalInflow}
                  </b>{" "}
                  亿
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
