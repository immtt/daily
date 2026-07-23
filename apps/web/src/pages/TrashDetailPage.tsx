import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import { MarketCard } from "../components/MarketCard";
import { AppHeader } from "../components/AppHeader";
import {
  enrichContentStocks,
} from "../lib/stockText";
import { formatPnl, formatStockTag, moodEmoji, pnlClass } from "../lib/format";
import { generateHTML } from "../lib/tiptapHtml";

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrashDetailPage() {
  const { id } = useParams();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [resolvedStocks, setResolvedStocks] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  useEffect(() => {
    if (!id) return;
    setConfirmPurge(false);
    setActionError("");
    api
      .getTrashEntry(id)
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

  async function onRestore() {
    if (!id) return;
    setBusy(true);
    setActionError("");
    try {
      await api.restoreEntry(id);
      window.location.replace(`/entries/${id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "恢复失败");
      setBusy(false);
    }
  }

  async function onPurge() {
    if (!id) return;
    if (!confirmPurge) {
      setConfirmPurge(true);
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      await api.purgeEntry(id);
      window.location.replace("/trash");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "删除失败");
      setBusy(false);
      setConfirmPurge(false);
    }
  }

  if (error) {
    return (
      <div className="app-shell">
        <p className="form-error center">{error}</p>
        <Link to="/trash" className="btn-secondary">
          返回废纸篓
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
          <Link to="/trash" className="btn-ghost">
            ← 废纸篓
          </Link>
        }
        center={<div className="brand-sm">已删除</div>}
      />

      <main className="app-main detail">
        <p className="trash-meta muted">
          删除于 {formatDateTime(entry.deletedAt)} · 将于{" "}
          {formatDateTime(entry.purgeAt)} 自动清除
        </p>
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

        {stocks.length > 0 && (
          <div className="stock-tags">
            {stocks.map((s) => (
              <span key={s.code} className="stock-tag">
                {formatStockTag(s)}
              </span>
            ))}
          </div>
        )}

        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        {actionError && <p className="form-error delete-error">{actionError}</p>}
      </main>

      <footer className="detail-actions">
        {confirmPurge ? (
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => setConfirmPurge(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={busy}
              onClick={() => void onPurge()}
            >
              {busy ? "删除中…" : "确认彻底删除"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void onRestore()}
            >
              {busy ? "处理中…" : "恢复"}
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={busy}
              onClick={() => void onPurge()}
            >
              彻底删除
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
