export type EntryCategory = "review" | "mindset";

export const ENTRY_CATEGORIES: Array<{
  id: EntryCategory;
  label: string;
  hint: string;
}> = [
  { id: "review", label: "复盘", hint: "当日交易得失与行情回顾" },
  { id: "mindset", label: "心法", hint: "原则、纪律与长期认知" },
];

export function categoryLabel(id: string | null | undefined) {
  return ENTRY_CATEGORIES.find((c) => c.id === id)?.label ?? "复盘";
}

export function isEntryCategory(v: string): v is EntryCategory {
  return v === "review" || v === "mindset";
}

export const MOODS = [
  { id: "calm", label: "平静", color: "#7ec8a3" },
  { id: "anxious", label: "焦虑", color: "#f0b429" },
  { id: "greedy", label: "贪婪", color: "#e8a838" },
  { id: "fearful", label: "恐惧", color: "#8b9dc3" },
  { id: "neutral", label: "一般", color: "#a8b0bc" },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

/** @deprecated 用 MoodFace 组件；保留兼容旧调用 */
export function moodEmoji(id: string | null | undefined) {
  const map: Record<string, string> = {
    calm: "😌",
    anxious: "😰",
    greedy: "🤑",
    fearful: "😨",
    neutral: "😐",
  };
  return id ? map[id] ?? "" : "";
}

/** 股票标签：无名称或与代码相同时只显示代码 */
export function formatStockTag(s: { code: string; name: string }) {
  const name = s.name?.trim();
  return name && name !== s.code ? `${s.code} ${name}` : s.code;
}

/** 列表卡片：优先显示股票名称 */
export function formatStockName(s: { code: string; name: string }) {
  const name = s.name?.trim();
  return name && name !== s.code ? name : s.code;
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
