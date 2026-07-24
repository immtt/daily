import { useState } from "react";
import {
  formatCoords,
  getCurrentPosition,
  mapsUrl,
  type EntryLocation,
} from "../lib/geolocation";

type Props = {
  value: EntryLocation | null;
  onChange: (next: EntryLocation | null) => void;
};

export function LocationField({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onUseCurrent() {
    setLoading(true);
    setError("");
    try {
      const loc = await getCurrentPosition();
      onChange({ ...loc, label: value?.label?.trim() || undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "定位失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="location-field">
      <div className="location-actions">
        <button
          type="button"
          className="btn-secondary"
          disabled={loading}
          onClick={() => void onUseCurrent()}
        >
          {loading ? "定位中…" : "使用当前位置"}
        </button>
        {value && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              onChange(null);
              setError("");
            }}
          >
            清除位置
          </button>
        )}
      </div>
      {value && (
        <div className="location-card">
          <label className="field location-label-field">
            位置备注（可选）
            <input
              value={value.label ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  label: e.target.value.trim() || undefined,
                })
              }
              placeholder="例如：外滩、公司附近"
              maxLength={100}
            />
          </label>
          <p className="muted tiny location-coords">
            坐标 {formatCoords(value)}
            {" · "}
            <a href={mapsUrl(value)} target="_blank" rel="noreferrer">
              在地图中打开
            </a>
          </p>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function LocationChip({ location }: { location: EntryLocation }) {
  const label = location.label?.trim() || formatCoords(location);
  return (
    <a
      className="location-chip"
      href={mapsUrl(location)}
      target="_blank"
      rel="noreferrer"
      title={formatCoords(location)}
    >
      📍 {label}
    </a>
  );
}
