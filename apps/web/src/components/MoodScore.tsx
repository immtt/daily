type Props = {
  score: number | null | undefined;
  compact?: boolean;
};

export function MoodScoreBadge({ score, compact = false }: Props) {
  if (score == null) return null;
  return (
    <span
      className={`mood-score ${compact ? "mood-score--compact" : ""}`}
      title={`情绪值 ${score}`}
    >
      情绪 {score}
    </span>
  );
}

export function MoodScoreInput({
  value,
  onChange,
  inline = false,
}: {
  value: string;
  onChange: (next: string) => void;
  inline?: boolean;
}) {
  return (
    <label className={`field mood-score-field ${inline ? "mood-score-field--inline" : ""}`}>
      情绪值
      <div className="mood-score-input-row">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0–100，可选"
        />
        {!inline && <span className="muted tiny">0 最低，100 最高</span>}
      </div>
    </label>
  );
}
