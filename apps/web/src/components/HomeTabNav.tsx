import { Link } from "react-router-dom";
import type { EntryDomain } from "../lib/domain";
import { trashPath } from "../lib/domain";
import { LifeLockButton } from "./LifeGate";

type Props = {
  active: "diary" | "trash";
  domain: EntryDomain;
  domainLabel: string;
};

export function HomeTabNav({ active, domain, domainLabel }: Props) {
  return (
    <div className="home-nav">
      <div className="module-nav-row">
        <Link to="/" className="module-home-link">
          ← 首页
        </Link>
        <span className="module-nav-title">{domainLabel}</span>
        {domain === "life" && <LifeLockButton />}
      </div>
      <nav className="home-tab-bar">
        <Link
          to={`/${domain}`}
          className={active === "diary" ? "home-tab active" : "home-tab"}
        >
          日记
        </Link>
        <Link
          to={trashPath(domain)}
          className={active === "trash" ? "home-tab active" : "home-tab"}
        >
          废纸篓
        </Link>
      </nav>
    </div>
  );
}
