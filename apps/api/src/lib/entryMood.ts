export function parseMoodScore(
  value: unknown
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 0 || rounded > 100) return null;
  return rounded;
}

export function assertMoodScoreForDomain(
  domain: "stock" | "reading" | "life",
  moodScore: unknown
):
  | { ok: true; moodScore: number | null }
  | { ok: false; message: string } {
  if (domain === "reading") {
    return { ok: true, moodScore: null };
  }
  if (moodScore === undefined || moodScore === null || moodScore === "") {
    return { ok: true, moodScore: null };
  }
  const parsed = parseMoodScore(moodScore);
  if (parsed == null) {
    return { ok: false, message: "情绪值须为 0–100 的整数" };
  }
  return { ok: true, moodScore: parsed };
}
