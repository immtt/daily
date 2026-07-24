import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type DiaryEntry, type MarketSnapshot } from "../api/client";
import { DiaryEditor, extractCodesFromContent } from "../components/DiaryEditor";
import { BookTagInput } from "../components/BookTagInput";
import { CityTagInput } from "../components/CityTagInput";
import { MarketCard } from "../components/MarketCard";
import { AppHeader } from "../components/AppHeader";
import { MoodFace } from "../components/MoodFace";
import { MoodScoreInput } from "../components/MoodScore";
import {
  ENTRY_CATEGORIES,
  MOODS,
  todayStr,
  type EntryCategory,
} from "../lib/format";
import {
  type EntryDomain,
  domainDetailPath,
  domainListPath,
  resolveEntryDomain,
} from "../lib/domain";
import { normalizeContentStructure } from "../lib/normalizeContent";
import {
  tagsForDomain,
  type EntryTagId,
} from "../lib/entryTags";

type Props = {
  domain: EntryDomain;
};

function EntryDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="field field--date">
      日期
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function EntryEditPage({ domain }: Props) {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const isStock = domain === "stock";
  const isLife = domain === "life";
  const isReading = domain === "reading";
  const tagOptions = tagsForDomain(domain);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [category, setCategory] = useState<EntryCategory>("review");
  const [pnlDay, setPnlDay] = useState("");
  const [pnlTotal, setPnlTotal] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [moodScore, setMoodScore] = useState("");
  const [tag, setTag] = useState<EntryTagId | "">("");
  const [books, setBooks] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [content, setContent] = useState<unknown>({
    type: "doc",
    content: [{ type: "paragraph" }],
  });
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshot | null>(
    null
  );
  const [error, setError] = useState("");

  const onMarket = useCallback((s: MarketSnapshot | null) => {
    setMarketSnapshot(s);
  }, []);

  useEffect(() => {
    if (isNew) return;
    void api
      .getEntry(id!)
      .then((e: DiaryEntry) => {
        if (resolveEntryDomain(e) !== domain) {
          nav(domainDetailPath(resolveEntryDomain(e), e.id), { replace: true });
          return;
        }
        setTitle(e.title);
        setEntryDate(e.entryDate);
        setCategory(e.category === "mindset" ? "mindset" : "review");
        setPnlDay(e.pnlDay == null ? "" : String(e.pnlDay));
        setPnlTotal(e.pnlTotal == null ? "" : String(e.pnlTotal));
        setMood(e.mood);
        setMoodScore(e.moodScore == null ? "" : String(e.moodScore));
        setTag((e.tag as EntryTagId) || "");
        setBooks((e.books ?? []).map((b) => b.title));
        setCities((e.cities ?? []).map((c) => c.city));
        setContent(e.content ?? { type: "doc", content: [] });
        setMarketSnapshot((e.marketSnapshot as MarketSnapshot) || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [isNew, id, domain, nav]);

  async function onSave() {
    if (!title.trim()) {
      setError("请填写标题");
      return;
    }
    if (isStock && category !== "review" && category !== "mindset") {
      setError("请选择分类：复盘或心法");
      return;
    }
    if ((isReading || isLife) && !tag) {
      setError("请选择标签");
      return;
    }
    if (moodScore !== "") {
      const n = Number(moodScore);
      if (!Number.isInteger(n) || n < 0 || n > 100) {
        setError("情绪值须为 0–100 的整数");
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const normalizedContent = normalizeContentStructure(content);
      let stocks: Array<{ code: string; name: string }> = [];
      if (isStock) {
        const codes = extractCodesFromContent(normalizedContent);
        const looked = codes.length
          ? await api.lookupStocks(codes)
          : { items: [] };
        stocks = codes.map((code) => ({
          code,
          name: looked.items.find((s) => s.code === code)?.name || code,
        }));
      }
      const body: Record<string, unknown> = {
        domain,
        title: title.trim(),
        entryDate,
        content: normalizedContent,
      };
      if (isStock) {
        body.category = category;
        body.pnlDay = pnlDay === "" ? null : Number(pnlDay);
        body.pnlTotal = pnlTotal === "" ? null : Number(pnlTotal);
        body.mood = mood;
        body.moodScore = moodScore === "" ? null : Number(moodScore);
        body.marketSnapshot = marketSnapshot;
        body.stocks = stocks;
      } else if (isLife) {
        body.mood = mood;
        body.moodScore = moodScore === "" ? null : Number(moodScore);
        body.tag = tag;
        body.cities = cities.map((city) => ({ city }));
        body.stocks = [];
      } else {
        body.tag = tag;
        body.books = books.map((title) => ({ title }));
        body.stocks = [];
      }
      if (isNew) {
        const created = await api.createEntry(body);
        nav(domainDetailPath(domain, created.id), { replace: true });
      } else {
        await api.updateEntry(id!, body);
        nav(domainDetailPath(domain, id!), { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      setSaving(false);
    }
  }

  const backTo = isNew ? domainListPath(domain) : domainDetailPath(domain, id!);
  const domainTitles: Record<EntryDomain, string> = {
    stock: "股票",
    reading: "读书",
    life: "生活",
  };

  if (loading) {
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
          <Link to={backTo} className="btn-ghost">
            ← 返回
          </Link>
        }
        center={
          <div className="brand-sm">
            {isNew ? `写${domainTitles[domain]}` : "编辑"}
          </div>
        }
      />

      <main className="app-main edit">
        {isStock && (
          <div className="field">
            <span>
              分类 <em className="req">必选</em>
            </span>
            <div className="category-pick">
              {ENTRY_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`category-pick-card ${category === c.id ? "active" : ""}`}
                  onClick={() => setCategory(c.id)}
                >
                  <strong>{c.label}</strong>
                  <span>{c.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tagOptions.length > 0 && (
          <div className="field">
            <span>
              标签 <em className="req">必选</em>
            </span>
            <div className="category-pick">
              {tagOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`category-pick-card ${tag === t.id ? "active" : ""}`}
                  onClick={() => setTag(t.id)}
                >
                  <strong>{t.label}</strong>
                  <span>{t.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          标题
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isStock
                ? category === "mindset"
                  ? "一条可复用的心法"
                  : "今日复盘要点"
                : domain === "reading"
                  ? "读书笔记标题"
                  : "生活记录标题"
            }
            maxLength={200}
          />
        </label>

        {isReading ? (
          <div className="field-row field-row--tag-date">
            <div className="field">
              <span>书名</span>
              <BookTagInput value={books} onChange={setBooks} />
            </div>
            <EntryDateField value={entryDate} onChange={setEntryDate} />
          </div>
        ) : isLife ? (
          <div className="field-row field-row--tag-date">
            <div className="field">
              <span>城市（可选）</span>
              <CityTagInput value={cities} onChange={setCities} />
            </div>
            <EntryDateField value={entryDate} onChange={setEntryDate} />
          </div>
        ) : (
          <EntryDateField value={entryDate} onChange={setEntryDate} />
        )}

        {isStock && category === "review" && (
          <div className="field-row">
            <label className="field">
              当日盈亏
              <input
                type="number"
                step="0.01"
                value={pnlDay}
                onChange={(e) => setPnlDay(e.target.value)}
                placeholder="元"
              />
            </label>
            <label className="field">
              总盈亏
              <input
                type="number"
                step="0.01"
                value={pnlTotal}
                onChange={(e) => setPnlTotal(e.target.value)}
                placeholder="元"
              />
            </label>
          </div>
        )}

        {(isStock || isLife) && (
          <div className="field-row field-row--mood">
            <div className="field">
              <span>情绪（可选）</span>
              <div className="mood-row">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mood-btn ${mood === m.id ? "active" : ""}`}
                    onClick={() => setMood(mood === m.id ? null : m.id)}
                    title={m.label}
                    aria-label={m.label}
                  >
                    <MoodFace id={m.id} size={28} />
                  </button>
                ))}
              </div>
            </div>
            <MoodScoreInput
              value={moodScore}
              onChange={setMoodScore}
              inline
            />
          </div>
        )}

        {isStock && category === "review" && (
          <MarketCard
            date={entryDate}
            snapshot={marketSnapshot}
            onChange={onMarket}
            editable
          />
        )}

        <div className="field">
          <span>正文</span>
          <DiaryEditor
            value={content}
            onChange={setContent}
            enableStockTagify={isStock}
            placeholder={
              isStock
                ? undefined
                : domain === "reading"
                  ? "摘录、感想、可复用的观点…"
                  : "记录今天的生活与想法…"
            }
          />
        </div>

        {error && <p className="form-error">{error}</p>}
      </main>

      <footer className="detail-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </footer>
    </div>
  );
}
