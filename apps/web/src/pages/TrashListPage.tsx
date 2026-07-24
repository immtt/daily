import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import { formatPnl, categoryLabel, pnlClass } from "../lib/format";
import { AppHeader } from "../components/AppHeader";
import { HomeTabNav } from "../components/HomeTabNav";
import { MoodFace } from "../components/MoodFace";
import { StockTagRow } from "../components/ProseGallery";

function formatPurgeAt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

export function TrashListPage() {
  const location = useLocation();
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [retentionDays, setRetentionDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .listTrash()
      .then((res) => {
        setItems(res.items);
        setRetentionDays(res.retentionDays);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [location.key]);

  return (
    <div className="app-shell">
      <AppHeader
        left={
          <div>
            <div className="brand-sm">增长日记</div>
          </div>
        }
      />

      <HomeTabNav active="trash" />

      <main className="app-main">
        <p className="trash-hint muted">
          删除的复盘保留 {retentionDays} 天，到期自动清除。可恢复或彻底删除。
        </p>

        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p className="muted center">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted center empty">废纸篓是空的</p>
        ) : (
          <ul className="entry-list">
            {items.map((e) => (
              <li key={e.id}>
                <Link to={`/trash/${e.id}`} className="entry-card trash-card">
                  <div className="entry-top">
                    <div className="entry-top-left">
                      <time>{e.entryDate}</time>
                      <span
                        className={`category-chip category-chip--${e.category || "review"}`}
                      >
                        {categoryLabel(e.category)}
                      </span>
                    </div>
                    <span className="muted tiny">
                      {e.purgeAt
                        ? `${formatPurgeAt(e.purgeAt)} 清除`
                        : ""}
                    </span>
                  </div>
                  <h2 className="entry-title">{e.title}</h2>
                  <div className="entry-meta entry-meta--slot">
                    <span className={pnlClass(e.pnlDay)}>
                      当日 {formatPnl(e.pnlDay)}
                    </span>
                    <MoodFace id={e.mood} size={24} />
                  </div>
                  <StockTagRow stocks={e.stocks} compact max={3} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
