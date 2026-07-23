import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type DiaryEntry, type MarketSnapshot } from "../api/client";
import { DiaryEditor, extractCodesFromContent } from "../components/DiaryEditor";
import { MarketCard } from "../components/MarketCard";
import { AppHeader } from "../components/AppHeader";
import { MOODS, todayStr } from "../lib/format";

export function DiaryEditPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [pnlDay, setPnlDay] = useState("");
  const [pnlTotal, setPnlTotal] = useState("");
  const [mood, setMood] = useState<string | null>(null);
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
        setTitle(e.title);
        setEntryDate(e.entryDate);
        setPnlDay(e.pnlDay == null ? "" : String(e.pnlDay));
        setPnlTotal(e.pnlTotal == null ? "" : String(e.pnlTotal));
        setMood(e.mood);
        setContent(e.content ?? { type: "doc", content: [] });
        setMarketSnapshot((e.marketSnapshot as MarketSnapshot) || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [isNew, id]);

  async function onSave() {
    if (!title.trim()) {
      setError("请填写标题");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const codes = extractCodesFromContent(content);
      const looked = codes.length
        ? await api.lookupStocks(codes)
        : { items: [] };
      const stocks = codes.map((code) => ({
        code,
        name: looked.items.find((s) => s.code === code)?.name || code,
      }));
      const body = {
        title: title.trim(),
        entryDate,
        pnlDay: pnlDay === "" ? null : Number(pnlDay),
        pnlTotal: pnlTotal === "" ? null : Number(pnlTotal),
        mood,
        marketSnapshot,
        content,
        stocks,
      };
      if (isNew) {
        const created = await api.createEntry(body);
        nav(`/entries/${created.id}`, { replace: true });
      } else {
        await api.updateEntry(id!, body);
        nav(`/entries/${id}`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      setSaving(false);
    }
  }

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
          <Link to={isNew ? "/" : `/entries/${id}`} className="btn-ghost">
            ← 返回
          </Link>
        }
        center={<div className="brand-sm">{isNew ? "写复盘" : "编辑"}</div>}
      />

      <main className="app-main edit">
        <label className="field">
          标题
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="今日复盘要点"
            maxLength={200}
          />
        </label>

        <label className="field">
          复盘日期
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </label>

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

        <div className="field">
          <span>情绪</span>
          <div className="mood-row">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mood-btn ${mood === m.id ? "active" : ""}`}
                onClick={() => setMood(mood === m.id ? null : m.id)}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        <MarketCard
          date={entryDate}
          snapshot={marketSnapshot}
          onChange={onMarket}
          editable
        />

        <div className="field">
          <span>正文</span>
          <DiaryEditor value={content} onChange={setContent} />
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
