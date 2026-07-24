import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { ENTRY_DOMAINS } from "../lib/domain";

export function HubPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="app-shell">
      <AppHeader
        left={
          <div>
            <div className="brand-sm">增长日记</div>
          </div>
        }
      />

      <main className="app-main hub-main">
        <p className="hub-lead muted">选择记录方向，各模块独立，互不混排</p>
        <div className="hub-grid">
          {ENTRY_DOMAINS.map((d) => (
            <Link
              key={d.id}
              to={`/${d.id}`}
              className={`hub-card hub-card--${d.id} ${mounted ? "hub-card--in" : ""}`}
            >
              <span className="hub-card-icon" aria-hidden="true">
                {d.icon}
              </span>
              <strong className="hub-card-title">{d.label}</strong>
              <span className="hub-card-hint">{d.hint}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
