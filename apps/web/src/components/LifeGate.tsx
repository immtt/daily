import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { isLifeUnlocked, lockLife, unlockLife } from "../lib/lifeAccess";

type Props = {
  children: ReactNode;
  /** 为 false 时不校验密码，直接展示子内容 */
  enabled?: boolean;
};

export function LifeGate({ children, enabled = true }: Props) {
  const [unlocked, setUnlocked] = useState(isLifeUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (unlockLife(password)) {
      setUnlocked(true);
      setError("");
      setPassword("");
      window.dispatchEvent(new Event("life-unlocked"));
      return;
    }
    setError("密码不正确");
  }

  if (!enabled || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <AppHeader
        left={
          <Link to="/" className="btn-ghost">
            ← 首页
          </Link>
        }
        center={<div className="brand-sm">生活</div>}
      />
      <main className="app-main">
        <div className="life-gate-card">
          <h2 className="life-gate-title">进入生活栏目</h2>
          <p className="muted life-gate-hint">此栏目需要单独密码访问</p>
          <form onSubmit={onSubmit} className="life-gate-form">
            <label className="field">
              访问密码
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                placeholder="请输入密码"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary">
              进入
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export function LifeLockButton() {
  if (!isLifeUnlocked()) return null;
  return (
    <button
      type="button"
      className="btn-ghost life-lock-btn"
      onClick={() => {
        lockLife();
        window.location.href = "/";
      }}
    >
      锁定生活
    </button>
  );
}
