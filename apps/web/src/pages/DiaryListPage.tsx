import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import {
  categoryLabel,
  formatPnl,
  formatStockTag,
  pnlClass,
  type EntryCategory,
} from "../lib/format";
import { AppHeader } from "../components/AppHeader";
import { HomeTabNav } from "../components/HomeTabNav";
import { MoodFace } from "../components/MoodFace";

type CategoryFilter = "" | EntryCategory;

export function DiaryListPage() {
  const location = useLocation();
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextCategory: CategoryFilter = category) {
    setLoading(true);
    setError("");
    try {
      const res = await api.listEntries({
        from,
        to,
        stockCode,
        ...(nextCategory ? { category: nextCategory } : {}),
      });
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

      <HomeTabNav active="diary" />

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

        <section className="filter-bar">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">至</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <input
            placeholder="股票代码或名称"
            value={stockCode}
            onChange={(e) => setStockCode(e.target.value.trim())}
          />
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
                <Link to={`/entries/${e.id}`} className="entry-card">
                  <div className="entry-top">
                    <div className="entry-top-left">
                      <time>{e.entryDate}</time>
                      <span
                        className={`category-chip category-chip--${e.category || "review"}`}
                      >
                        {categoryLabel(e.category)}
                      </span>
                    </div>
                    <MoodFace id={e.mood} size={26} />
                  </div>
                  <h2 className="entry-title">{e.title}</h2>
                  <div className="entry-meta">
                    <span className={pnlClass(e.pnlDay)}>
                      当日 {formatPnl(e.pnlDay)}
                    </span>
                    <span className={pnlClass(e.pnlTotal)}>
                      累计 {formatPnl(e.pnlTotal)}
                    </span>
                  </div>
                  {e.stocks.length > 0 && (
                    <div className="stock-tags">
                      {e.stocks.slice(0, 4).map((s) => (
                        <span key={s.code} className="stock-tag">
                          {formatStockTag(s)}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Link to="/entries/new" className="fab-write" aria-label="写日记">
        +
      </Link>
    </div>
  );
}
