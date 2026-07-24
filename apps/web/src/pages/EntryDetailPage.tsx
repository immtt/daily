import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type DiaryEntry, type EntryLocation } from "../api/client";
import { MarketCard } from "../components/MarketCard";
import { AppHeader } from "../components/AppHeader";
import { BookTagRow } from "../components/BookTagInput";
import { LocationChip } from "../components/LocationField";
import { enrichContentStocks } from "../lib/stockText";
import { formatPnl, categoryLabel, pnlClass } from "../lib/format";
import {
  type EntryDomain,
  domainEditPath,
  domainLabel,
  domainListPath,
  resolveEntryDomain,
} from "../lib/domain";
import { tagLabel } from "../lib/entryTags";
import { generateHTML } from "../lib/tiptapHtml";
import { MoodFace } from "../components/MoodFace";
import { MoodScoreBadge } from "../components/MoodScore";
import { ProseGallery } from "../components/ProseGallery";

type Props = {
  domain: EntryDomain;
};

export function EntryDetailPage({ domain }: Props) {
  const { id } = useParams();
  const nav = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [resolvedStocks, setResolvedStocks] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pinning, setPinning] = useState(false);

  const isStock = domain === "stock";

  useEffect(() => {
    if (!id) return;
    setConfirmDelete(false);
    setDeleteError("");
    api
      .getEntry(id)
      .then((e) => {
        if (resolveEntryDomain(e) !== domain) {
          nav(`/${resolveEntryDomain(e)}/${e.id}`, { replace: true });
          return;
        }
        setEntry(e);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"));
  }, [id, domain, nav]);

  useEffect(() => {
    if (!entry || !isStock) return;
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
  }, [entry, isStock]);

  const stocks = useMemo(() => {
    if (!entry || !isStock) return [];
    const nameMap = new Map(resolvedStocks.map((s) => [s.code, s.name]));
    return entry.stocks.map((s) => ({
      code: s.code,
      name: nameMap.get(s.code) || s.name,
    }));
  }, [entry, resolvedStocks, isStock]);

  const html = useMemo(() => {
    if (!entry) return "";
    const raw = isStock
      ? enrichContentStocks(entry.content, resolvedStocks)
      : entry.content;
    return generateHTML(raw);
  }, [entry, resolvedStocks, isStock]);

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
      window.location.replace(domainListPath(domain));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "删除失败";
      setDeleteError(msg);
      setDeleting(false);
    }
  }

  function cancelDelete() {
    setConfirmDelete(false);
    setDeleteError("");
  }

  async function onTogglePin() {
    if (!entry) return;
    setPinning(true);
    setDeleteError("");
    try {
      const next = await api.pinEntry(entry.id, !entry.pinned);
      setEntry(next);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "置顶失败");
    } finally {
      setPinning(false);
    }
  }

  if (error) {
    return (
      <div className="app-shell">
        <p className="form-error center">{error}</p>
        <Link to={domainListPath(domain)} className="btn-secondary">
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
          <Link to={domainListPath(domain)} className="btn-ghost">
            ← 返回
          </Link>
        }
        center={<div className="brand-sm">详情</div>}
      />

      <main className="app-main detail">
        <div className="detail-meta-row">
          <time className="muted">{entry.entryDate}</time>
          {isStock ? (
            <span
              className={`category-chip category-chip--${entry.category || "review"}`}
            >
              {categoryLabel(entry.category)}
            </span>
          ) : (
            <>
              {entry.tag ? (
                <span className={`tag-chip tag-chip--${entry.tag}`}>
                  {tagLabel(domain, entry.tag)}
                </span>
              ) : (
                <span className={`domain-chip domain-chip--${domain}`}>
                  {domainLabel(domain)}
                </span>
              )}
            </>
          )}
          {entry.pinned && <span className="pin-badge">置顶</span>}
        </div>
        <h1 className="entry-title lg">
          <span>{entry.title}</span>
          {(isStock || domain === "life") && (
            <span className="detail-mood-group">
              <MoodFace id={entry.mood} size={32} />
              <MoodScoreBadge score={entry.moodScore} />
            </span>
          )}
        </h1>
        {isStock && entry.category !== "mindset" && (
          <div className="entry-meta">
            <span className={pnlClass(entry.pnlDay)}>
              当日 {formatPnl(entry.pnlDay)}
            </span>
            <span className={pnlClass(entry.pnlTotal)}>
              累计 {formatPnl(entry.pnlTotal)}
            </span>
          </div>
        )}

        {domain === "reading" && (entry.books?.length ?? 0) > 0 && (
          <BookTagRow books={entry.books ?? []} compact={false} />
        )}

        {domain === "life" && entry.location && (
          <div className="detail-location-row">
            <LocationChip location={entry.location as EntryLocation} />
          </div>
        )}

        {isStock && entry.marketSnapshot && entry.category !== "mindset" && (
          <MarketCard date={entry.entryDate} snapshot={entry.marketSnapshot} />
        )}

        <ProseGallery
          html={html}
          content={entry.content}
          stocks={isStock ? stocks : undefined}
          compactStocks={false}
        />
        {deleteError && (
          <p className="form-error delete-error">{deleteError}</p>
        )}
      </main>

      <footer
        className={`detail-actions ${confirmDelete ? "detail-actions--confirm" : "detail-actions--triple"}`}
      >
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
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void onTogglePin()}
              disabled={pinning || deleting}
            >
              {pinning ? "处理中…" : entry.pinned ? "取消置顶" : "置顶"}
            </button>
            <Link to={domainEditPath(domain, entry.id)} className="btn-primary">
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
