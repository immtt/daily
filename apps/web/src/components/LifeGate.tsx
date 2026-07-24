import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppHeader } from "./AppHeader";
import { useAuth } from "../hooks/useAuth";
import {
  isLifeUnlocked,
  lockLife,
  markLifeUnlocked,
} from "../lib/lifeAccess";

type Props = {
  children: ReactNode;
  /** 为 false 时不校验密码，直接展示子内容 */
  enabled?: boolean;
};

export function LifeGate({ children, enabled = true }: Props) {
  const { user } = useAuth();
  const gateRequired = enabled && Boolean(user?.lifeAccessEnabled);
  const [unlocked, setUnlocked] = useState(() =>
    gateRequired ? isLifeUnlocked() : true
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await api.verifyLifeAccess(password);
      if (!res.ok) {
        setError("密码不正确");
        return;
      }
      markLifeUnlocked(res.required ? password : null);
      setUnlocked(true);
      setPassword("");
      window.dispatchEvent(new Event("life-unlocked"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (!gateRequired || unlocked) {
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
          <p className="muted life-gate-hint">
            此栏目已启用访问密码；离开后再进入需重新输入
          </p>
          <form onSubmit={(e) => void onSubmit(e)} className="life-gate-form">
            <label className="field">
              访问密码
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                placeholder="请输入生活栏目密码"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "验证中…" : "进入"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export function LifeLockButton() {
  const { user } = useAuth();
  if (!user?.lifeAccessEnabled || !isLifeUnlocked()) return null;
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
