import { useState, type KeyboardEvent } from "react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

function normalizeCities(cities: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of cities) {
    const city = raw.trim();
    if (!city) continue;
    const key = city.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(city.slice(0, 64));
  }
  return result;
}

function splitDraft(raw: string) {
  return raw
    .split(/[,，;；\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CityTagInput({
  value,
  onChange,
  placeholder = "输入城市，回车或逗号添加",
}: Props) {
  const [draft, setDraft] = useState("");

  function commitDraft(raw: string) {
    const parts = splitDraft(raw);
    if (parts.length === 0) return;
    onChange(
      normalizeCities([
        ...value,
        ...parts.map((p) => p.slice(0, 64)),
      ])
    );
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitDraft(draft);
      return;
    }
    if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="city-tag-input">
      {value.length > 0 && (
        <div className="stock-tags">
          {value.map((city, i) => (
            <span key={`${city}-${i}`} className="city-tag">
              {city}
              <button
                type="button"
                className="city-tag-remove"
                aria-label={`移除 ${city}`}
                onClick={() => removeAt(i)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="tag-draft-input"
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          if (/[,，;；]/.test(next)) {
            commitDraft(next);
            return;
          }
          setDraft(next);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => commitDraft(draft)}
        placeholder={placeholder}
        maxLength={64}
      />
    </div>
  );
}

export function CityTagRow({
  cities,
  compact = true,
  max = 3,
}: {
  cities: Array<{ city: string }>;
  compact?: boolean;
  max?: number;
}) {
  if (!cities.length) {
    return compact ? <div className="stock-tags stock-tags--slot" /> : null;
  }
  const shown = compact ? cities.slice(0, max) : cities;
  const more = compact ? Math.max(0, cities.length - max) : 0;
  return (
    <div className={`stock-tags ${compact ? "stock-tags--slot" : ""}`}>
      {shown.map((c) => (
        <span key={c.city} className="city-tag" title={c.city}>
          {c.city}
        </span>
      ))}
      {more > 0 && <span className="city-tag city-tag--more">+{more}</span>}
    </div>
  );
}
