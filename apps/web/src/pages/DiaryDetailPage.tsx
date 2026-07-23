import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import { MarketCard } from "../components/MarketCard";
import { formatPnl, moodEmoji, pnlClass } from "../lib/format";
import { generateHTML } from "../lib/tiptapHtml";

export function DiaryDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getEntry(id)
      .then(setEntry)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"));
  }, [id]);

  async function onDelete() {
    if (!id || !confirm("确认删除这条复盘？")) return;
    setDeleting(true);
    try {
      await api.deleteEntry(id);
      nav("/", { replace: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <div className="app-shell">
        <p className="form-error center">{error}</p>
        <Link to="/" className="btn-secondary">
          返回
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="app-shell">
        <p className="muted center">加载中…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="btn-ghost">
          ← 返回
        </Link>
        <div className="brand-sm">详情</div>
        <span />
      </header>

      <main className="app-main detail">
        <time className="muted">{entry.entryDate}</time>
        <h1 className="entry-title lg">
          {entry.title} {moodEmoji(entry.mood)}
        </h1>
        <div className="entry-meta">
          <span className={pnlClass(entry.pnlDay)}>
            当日 {formatPnl(entry.pnlDay)}
          </span>
          <span className={pnlClass(entry.pnlTotal)}>
            累计 {formatPnl(entry.pnlTotal)}
          </span>
        </div>

        {entry.marketSnapshot && (
          <MarketCard date={entry.entryDate} snapshot={entry.marketSnapshot} />
        )}

        {entry.stocks.length > 0 && (
          <div className="stock-tags">
            {entry.stocks.map((s) => (
              <span key={s.code} className="stock-tag">
                {s.code} {s.name}
              </span>
            ))}
          </div>
        )}

        <article
          className="prose"
          dangerouslySetInnerHTML={{
            __html: generateHTML(entry.content),
          }}
        />
      </main>

      <footer className="detail-actions">
        <Link to={`/entries/${entry.id}/edit`} className="btn-primary">
          编辑
        </Link>
        <button
          type="button"
          className="btn-danger"
          onClick={() => void onDelete()}
          disabled={deleting}
        >
          {deleting ? "删除中…" : "删除"}
        </button>
      </footer>
    </div>
  );
}
