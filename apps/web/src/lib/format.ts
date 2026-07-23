export const MOODS = [
  { id: "calm", emoji: "😌", label: "平静" },
  { id: "anxious", emoji: "😰", label: "焦虑" },
  { id: "greedy", emoji: "🤑", label: "贪婪" },
  { id: "fearful", emoji: "😨", label: "恐惧" },
  { id: "neutral", emoji: "😐", label: "一般" },
] as const;

export function moodEmoji(id: string | null | undefined) {
  return MOODS.find((m) => m.id === id)?.emoji ?? "";
}

/** 股票标签：无名称或与代码相同时只显示代码 */
export function formatStockTag(s: { code: string; name: string }) {
  const name = s.name?.trim();
  return name && name !== s.code ? `${s.code} ${name}` : s.code;
}

export function formatPnl(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("zh-CN", {
    maximumFractionDigits: 2,
  })}`;
}

export function pnlClass(n: number | null | undefined) {
  if (n == null || n === 0) return "";
  return n > 0 ? "up" : "down";
}

export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
