import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import { MarketCard } from "../components/MarketCard";
import { AppHeader } from "../components/AppHeader";
import {
  enrichContentStocks,
} from "../lib/stockText";
import { formatPnl, formatStockTag, categoryLabel, pnlClass } from "../lib/format";
import { generateHTML } from "../lib/tiptapHtml";
import { MoodFace } from "../components/MoodFace";

export function DiaryDetailPage() {
  const { id } = useParams();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [resolvedStocks, setResolvedStocks] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!id) return;
    setConfirmDelete(false);
    setDeleteError("");
    api
      .getEntry(id)
      .then(setEntry)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"));
  }, [id]);

  useEffect(() => {
    if (!entry) return;
    const text = JSON.stringify(entry.content ?? {});
    void api.resolveStocksInText(text).then((res) => {
      const map = new Map<string, string>();
      for (const s of res.items) map.set(s.code, s.name);
      for (const s of entry.stocks) {
        if (s.name && s.name !== s.code) map.set(s.code, s.name);
      }
      setResolvedStocks(
        [...map.entries()].map(([code, name]) => ({ code, name }))
      );
    });
  }, [entry]);

  const stocks = useMemo(() => {
    if (!entry) return [];
    const nameMap = new Map(resolvedStocks.map((s) => [s.code, s.name]));
    return entry.stocks.map((s) => ({
      code: s.code,
      name: nameMap.get(s.code) || s.name,
    }));
  }, [entry, resolvedStocks]);

  const html = useMemo(() => {
    if (!entry) return "";
    return generateHTML(enrichContentStocks(entry.content, resolvedStocks));
  }, [entry, resolvedStocks]);

  async function onDelete() {
    const entryId = entry?.id || id;
    if (!entryId) return;
    if (!confirmDelete) {
      setDeleteError("");
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteEntry(entryId);
      window.location.replace("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "删除失败";
      setDeleteError(msg);
      setDeleting(false);
      // 保持 confirmDelete=true，便于重试
    }
  }

  function cancelDelete() {
    setConfirmDelete(false);
    setDeleteError("");
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
      <AppHeader
        left={
          <Link to="/" className="btn-ghost">
            ← 返回
          </Link>
        }
        center={<div className="brand-sm">详情</div>}
      />

      <main className="app-main detail">
        <div className="detail-meta-row">
          <time className="muted">{entry.entryDate}</time>
          <span className={`category-chip category-chip--${entry.category || "review"}`}>
            {categoryLabel(entry.category)}
          </span>
        </div>
        <h1 className="entry-title lg">
          <span>{entry.title}</span>
          <MoodFace id={entry.mood} size={32} />
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

        {stocks.length > 0 && (
          <div className="stock-tags">
            {stocks.map((s) => (
              <span key={s.code} className="stock-tag">
                {formatStockTag(s)}
              </span>
            ))}
          </div>
        )}

        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {deleteError && (
          <p className="form-error delete-error">{deleteError}</p>
        )}
      </main>

      <footer className="detail-actions">
        {confirmDelete ? (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={cancelDelete}
              disabled={deleting}
            >
              取消
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => void onDelete()}
              disabled={deleting}
            >
              {deleting ? "移入中…" : "确认移入废纸篓"}
            </button>
          </>
        ) : (
          <>
            <Link to={`/entries/${entry.id}/edit`} className="btn-primary">
              编辑
            </Link>
            <button
              type="button"
              className="btn-danger"
              onClick={() => void onDelete()}
              disabled={deleting}
            >
              移入废纸篓
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
