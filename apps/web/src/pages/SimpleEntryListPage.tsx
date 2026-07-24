import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, type DiaryEntry } from "../api/client";
import { domainNewPath } from "../lib/domain";
import { tagLabel, tagsForDomain } from "../lib/entryTags";
import { isLifeUnlocked } from "../lib/lifeAccess";
import { AppHeader } from "../components/AppHeader";
import { HomeTabNav } from "../components/HomeTabNav";
import { MoodFace } from "../components/MoodFace";
import { BookTagRow } from "../components/BookTagInput";
import { LocationChip } from "../components/LocationField";
import type { EntryLocation } from "../api/client";

type SimpleListProps = {
  domain: "reading" | "life";
  domainLabel: string;
  emptyHint: string;
  searchPlaceholder: string;
  showMood?: boolean;
};

export function SimpleEntryListPage({
  domain,
  domainLabel,
  emptyHint,
  searchPlaceholder,
  showMood = false,
}: SimpleListProps) {
  const location = useLocation();
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const tagOptions = tagsForDomain(domain);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      if (domain === "life" && !isLifeUnlocked()) {
        setItems([]);
        return;
      }
      const params: Record<string, string> = { domain, from, to };
      if (keyword.trim()) params.q = keyword.trim();
      if (tagFilter) params.tag = tagFilter;
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
  }, [location.key, tagFilter]);

  useEffect(() => {
    function onLifeUnlock() {
      void load();
    }
    window.addEventListener("life-unlocked", onLifeUnlock);
    return () => window.removeEventListener("life-unlocked", onLifeUnlock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, from, to, keyword, tagFilter]);

  return (
    <div className="app-shell">
      <AppHeader
        left={
          <div>
            <div className="brand-sm">增长日记</div>
          </div>
        }
      />

      <HomeTabNav active="diary" domain={domain} domainLabel={domainLabel} />

      <main className="app-main">
        <section className="filter-bar filter-bar--simple">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">至</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <input
            className="filter-keyword"
            placeholder={searchPlaceholder}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load();
            }}
          />
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            筛选
          </button>
        </section>

        {tagOptions.length > 0 && (
          <div className="category-tabs" role="tablist" aria-label="标签筛选">
            <button
              type="button"
              role="tab"
              aria-selected={tagFilter === ""}
              className={`category-tab ${tagFilter === "" ? "active" : ""}`}
              onClick={() => setTagFilter("")}
            >
              全部
            </button>
            {tagOptions.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tagFilter === t.id}
                className={`category-tab ${tagFilter === t.id ? "active" : ""}`}
                onClick={() => setTagFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p className="muted center">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted center empty">{emptyHint}</p>
        ) : (
          <ul className="entry-list">
            {items.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/${domain}/${e.id}`}
                  className={`entry-card entry-card--simple ${e.pinned ? "entry-card--pinned" : ""}`}
                >
                  <div className="entry-top">
                    <div className="entry-top-left">
                      {e.pinned && <span className="pin-badge">置顶</span>}
                      <time>{e.entryDate}</time>
                      <span className={`domain-chip domain-chip--${domain}`}>
                        {domainLabel}
                      </span>
                      {e.tag && (
                        <span className={`tag-chip tag-chip--${e.tag}`}>
                          {tagLabel(domain, e.tag)}
                        </span>
                      )}
                    </div>
                    {showMood ? <MoodFace id={e.mood} size={26} /> : <span />}
                  </div>
                  <h2 className="entry-title">{e.title}</h2>
                  {domain === "reading" && (e.books?.length ?? 0) > 0 && (
                    <BookTagRow books={e.books ?? []} />
                  )}
                  <div className="entry-meta entry-meta--slot">
                    {domain === "life" && e.location && (
                      <LocationChip location={e.location as EntryLocation} />
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Link to={domainNewPath(domain)} className="fab-write" aria-label={`写${domainLabel}笔记`}>
        +
      </Link>
    </div>
  );
}

export function ReadingListPage() {
  return (
    <SimpleEntryListPage
      domain="reading"
      domainLabel="读书"
      emptyHint="还没有读书笔记，点右下角 + 开始"
      searchPlaceholder="搜索标题或正文关键字"
    />
  );
}

export function LifeListPage() {
  return (
    <SimpleEntryListPage
      domain="life"
      domainLabel="生活"
      emptyHint="还没有生活记录，点右下角 + 开始"
      searchPlaceholder="搜索标题或正文关键字"
      showMood
    />
  );
}
