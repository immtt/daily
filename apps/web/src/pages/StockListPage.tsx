import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import {
  categoryLabel,
  formatPnl,
  pnlClass,
  type EntryCategory,
} from "../lib/format";
import { domainNewPath } from "../lib/domain";
import { AppHeader } from "../components/AppHeader";
import { HomeTabNav } from "../components/HomeTabNav";
import { ListFabStack } from "../components/ListFabStack";
import { MoodFace } from "../components/MoodFace";
import { MoodScoreBadge } from "../components/MoodScore";
import { StockTagRow } from "../components/ProseGallery";

type CategoryFilter = "" | EntryCategory;

export function StockListPage() {
  const location = useLocation();
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isMindset = category === "mindset";

  async function load(nextCategory: CategoryFilter = category) {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { domain: "stock", from, to };
      if (nextCategory) params.category = nextCategory;
      if (nextCategory === "mindset") {
        if (keyword.trim()) params.q = keyword.trim();
      } else if (nextCategory === "review") {
        if (stockCode) params.stockCode = stockCode;
      } else {
        if (stockCode) params.stockCode = stockCode;
        else if (keyword.trim()) params.q = keyword.trim();
      }
      const res = await api.listEntries(params);
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  function onCategory(next: CategoryFilter) {
    setCategory(next);
    void load(next);
  }

  return (
    <div className="app-shell">
      <AppHeader
        left={
          <div>
            <div className="brand-sm">增长日记</div>
          </div>
        }
      />

      <HomeTabNav domain="stock" domainLabel="股票" />

      <main className="app-main">
        <div className="category-tabs" role="tablist" aria-label="日记分类">
          {(
            [
              { id: "" as CategoryFilter, label: "全部" },
              { id: "review" as CategoryFilter, label: "复盘" },
              { id: "mindset" as CategoryFilter, label: "心法" },
            ] as const
          ).map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={category === t.id}
              className={`category-tab ${category === t.id ? "active" : ""}`}
              onClick={() => onCategory(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section className={`filter-bar ${isMindset ? "filter-bar--keyword" : ""}`}>
          {!isMindset && (
            <>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="muted">至</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
          {isMindset ? (
            <input
              className="filter-keyword"
              placeholder="搜索心法关键字"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
            />
          ) : (
            <input
              placeholder="股票代码或名称"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value.trim())}
            />
          )}
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            筛选
          </button>
        </section>

        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p className="muted center">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted center empty">
            {category === "mindset"
              ? "还没有心法，点右下角 + 开始"
              : "还没有复盘，点右下角 + 开始"}
          </p>
        ) : (
          <ul className="entry-list">
            {items.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/stock/${e.id}`}
                  className={`entry-card ${e.pinned ? "entry-card--pinned" : ""}`}
                >
                  <div className="entry-top">
                    <div className="entry-top-left">
                      {e.pinned && <span className="pin-badge">置顶</span>}
                      <time>{e.entryDate}</time>
                      <span
                        className={`category-chip category-chip--${e.category || "review"}`}
                      >
                        {categoryLabel(e.category)}
                      </span>
                    </div>
                    <span className="entry-mood-group">
                      <MoodFace id={e.mood} size={26} />
                      <MoodScoreBadge score={e.moodScore} compact />
                    </span>
                  </div>
                  <h2 className="entry-title">{e.title}</h2>
                  {e.category !== "mindset" ? (
                    <div className="entry-meta entry-meta--slot">
                      <span className={pnlClass(e.pnlDay)}>
                        当日 {formatPnl(e.pnlDay)}
                      </span>
                      <span className={pnlClass(e.pnlTotal)}>
                        累计 {formatPnl(e.pnlTotal)}
                      </span>
                    </div>
                  ) : (
                    <div className="entry-meta entry-meta--slot" aria-hidden="true" />
                  )}
                  <StockTagRow stocks={e.stocks} compact max={3} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <ListFabStack writeTo={domainNewPath("stock")} writeLabel="写股票笔记" />
    </div>
  );
}
