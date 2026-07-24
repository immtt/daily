import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import { formatPnl, categoryLabel, pnlClass } from "../lib/format";
import {
  type EntryDomain,
  domainLabel,
  isEntryDomain,
  resolveEntryDomain,
} from "../lib/domain";
import { AppHeader } from "../components/AppHeader";
import { HomeTabNav } from "../components/HomeTabNav";
import { LifeGate } from "../components/LifeGate";
import { useAuth } from "../hooks/useAuth";
import { MoodFace } from "../components/MoodFace";
import { MoodScoreBadge } from "../components/MoodScore";
import { tagLabel } from "../lib/entryTags";
import { isLifeUnlocked } from "../lib/lifeAccess";
import { BookTagRow } from "../components/BookTagInput";
import { LocationChip } from "../components/LocationField";
import type { EntryLocation } from "../api/client";
import { StockTagRow } from "../components/ProseGallery";

type DomainFilter = "" | EntryDomain;

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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const domainParam = searchParams.get("domain") ?? "";
  const domainFilter: DomainFilter =
    domainParam && isEntryDomain(domainParam) ? domainParam : "";

  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [retentionDays, setRetentionDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    if (domainFilter === "life" && user?.lifeAccessEnabled && !isLifeUnlocked()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const params: Record<string, string> = {};
    if (domainFilter) params.domain = domainFilter;
    api
      .listTrash(params)
      .then((res) => {
        setItems(res.items);
        setRetentionDays(res.retentionDays);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [location.key, domainFilter]);

  useEffect(() => {
    function onLifeUnlock() {
      if (domainFilter !== "life") return;
      setLoading(true);
      setError("");
      api
        .listTrash({ domain: "life" })
        .then((res) => {
          setItems(res.items);
          setRetentionDays(res.retentionDays);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
        .finally(() => setLoading(false));
    }
    window.addEventListener("life-unlocked", onLifeUnlock);
    return () => window.removeEventListener("life-unlocked", onLifeUnlock);
  }, [domainFilter]);

  function onDomainFilter(next: DomainFilter) {
    if (next) setSearchParams({ domain: next });
    else setSearchParams({});
  }

  const page = (
    <div className="app-shell">
      <AppHeader
        left={
          <div>
            <div className="brand-sm">增长日记</div>
          </div>
        }
      />

      <HomeTabNav domainLabel="废纸篓" />

      <main className="app-main">
        <div className="category-tabs" role="tablist" aria-label="方向筛选">
          {(
            [
              { id: "" as DomainFilter, label: "全部" },
              { id: "stock" as DomainFilter, label: "股票" },
              { id: "reading" as DomainFilter, label: "读书" },
              { id: "life" as DomainFilter, label: "生活" },
            ] as const
          ).map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={domainFilter === t.id}
              className={`category-tab ${domainFilter === t.id ? "active" : ""}`}
              onClick={() => onDomainFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="trash-hint muted">
          删除的笔记保留 {retentionDays} 天，到期自动清除。可恢复或彻底删除。
        </p>

        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p className="muted center">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted center empty">废纸篓是空的</p>
        ) : (
          <ul className="entry-list">
            {items.map((e) => {
              const entryDomain = resolveEntryDomain(e);
              const isStock = entryDomain === "stock";
              return (
                <li key={e.id}>
                  <Link
                    to={`/trash/${e.id}`}
                    className="entry-card trash-card"
                  >
                    <div className="entry-top">
                      <div className="entry-top-left">
                        <time>{e.entryDate}</time>
                        <span className={`domain-chip domain-chip--${entryDomain}`}>
                          {domainLabel(entryDomain)}
                        </span>
                        {isStock && (
                          <span
                            className={`category-chip category-chip--${e.category || "review"}`}
                          >
                            {categoryLabel(e.category)}
                          </span>
                        )}
                        {!isStock && e.tag && (
                          <span className={`tag-chip tag-chip--${e.tag}`}>
                            {tagLabel(entryDomain, e.tag)}
                          </span>
                        )}
                      </div>
                      <span className="muted tiny">
                        {e.purgeAt ? `${formatPurgeAt(e.purgeAt)} 清除` : ""}
                      </span>
                    </div>
                    <h2 className="entry-title">{e.title}</h2>
                    {isStock ? (
                      <>
                        <div className="entry-meta entry-meta--slot">
                          <span className={pnlClass(e.pnlDay)}>
                            当日 {formatPnl(e.pnlDay)}
                          </span>
                          <span className="entry-mood-group">
                            <MoodFace id={e.mood} size={24} />
                            <MoodScoreBadge score={e.moodScore} compact />
                          </span>
                        </div>
                        <StockTagRow stocks={e.stocks} compact max={3} />
                      </>
                    ) : (
                      <>
                        <div className="entry-meta entry-meta--slot">
                          {entryDomain === "life" ? (
                            <>
                              <span className="entry-mood-group">
                                <MoodFace id={e.mood} size={24} />
                                <MoodScoreBadge score={e.moodScore} compact />
                              </span>
                              {e.location && (
                                <LocationChip location={e.location as EntryLocation} />
                              )}
                            </>
                          ) : null}
                        </div>
                        {entryDomain === "reading" && (e.books?.length ?? 0) > 0 ? (
                          <BookTagRow books={e.books ?? []} />
                        ) : (
                          <div className="stock-tags stock-tags--slot" />
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );

  if (domainFilter === "life" && user?.lifeAccessEnabled) {
    return <LifeGate>{page}</LifeGate>;
  }
  return page;
}
