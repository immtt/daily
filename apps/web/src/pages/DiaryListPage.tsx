import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { formatPnl, moodEmoji, pnlClass } from "../lib/format";

export function DiaryListPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.listEntries({ from, to, stockCode });
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
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="brand-sm">复盘日记</div>
          <div className="muted tiny">{user?.username}</div>
        </div>
        <button type="button" className="btn-ghost" onClick={logout}>
          退出
        </button>
      </header>

      <main className="app-main">
        <section className="filter-bar">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">至</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <input
            placeholder="股票代码"
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
          <p className="muted center empty">还没有复盘，点下方「写复盘」开始</p>
        ) : (
          <ul className="entry-list">
            {items.map((e) => (
              <li key={e.id}>
                <Link to={`/entries/${e.id}`} className="entry-card">
                  <div className="entry-top">
                    <time>{e.entryDate}</time>
                    <span>{moodEmoji(e.mood)}</span>
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
                          {s.code} {s.name}
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

      <nav className="tab-bar">
        <Link to="/" className="tab active">
          日记
        </Link>
        <Link to="/entries/new" className="tab tab-write">
          写复盘
        </Link>
      </nav>
    </div>
  );
}
