import { useState, type FormEvent, type KeyboardEvent } from "react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

function normalizeTitles(titles: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of titles) {
    const title = raw.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(title.slice(0, 128));
  }
  return result;
}

export function BookTagInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function addTitle(raw: string) {
    const title = raw.trim();
    if (!title) return;
    onChange(normalizeTitles([...value, title]));
    setDraft("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    addTitle(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTitle(draft);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="book-tag-input">
      {value.length > 0 && (
        <div className="stock-tags">
          {value.map((title, i) => (
            <span key={`${title}-${i}`} className="book-tag">
              {title}
              <button
                type="button"
                className="book-tag-remove"
                aria-label={`移除 ${title}`}
                onClick={() => removeAt(i)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <form className="book-tag-form" onSubmit={onSubmit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="输入书名后回车或点添加"
          maxLength={128}
        />
        <button type="submit" className="btn-secondary">
          添加
        </button>
      </form>
    </div>
  );
}

export function BookTagRow({
  books,
  compact = true,
  max = 3,
}: {
  books: Array<{ title: string }>;
  compact?: boolean;
  max?: number;
}) {
  if (!books.length) {
    return compact ? <div className="stock-tags stock-tags--slot" /> : null;
  }
  const shown = compact ? books.slice(0, max) : books;
  const more = compact ? Math.max(0, books.length - max) : 0;
  return (
    <div className={`stock-tags ${compact ? "stock-tags--slot" : ""}`}>
      {shown.map((b) => (
        <span key={b.title} className="book-tag" title={b.title}>
          {b.title}
        </span>
      ))}
      {more > 0 && <span className="book-tag book-tag--more">+{more}</span>}
    </div>
  );
}
