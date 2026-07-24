import { Link } from "react-router-dom";
import type { EntryDomain } from "../lib/domain";
import { LifeLockButton } from "./LifeGate";

type Props = {
  domainLabel: string;
  domain?: EntryDomain;
};

export function HomeTabNav({ domain, domainLabel }: Props) {
  return (
    <div className="home-nav">
      <div className="module-nav-row">
        <Link to="/" className="module-home-link">
          ← 首页
        </Link>
        <span className="module-nav-title">{domainLabel}</span>
        {domain === "life" && <LifeLockButton />}
      </div>
    </div>
  );
}
