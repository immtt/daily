import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { THEMES } from "../lib/themes";

function avatarLetter(username?: string) {
  if (!username) return "?";
  return username.trim().charAt(0).toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const { themeId, setThemeId } = useTheme();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onLogout() {
    logout();
    setOpen(false);
    nav("/login", { replace: true });
  }

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-avatar-btn"
        aria-label="我的账户与设置"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar" aria-hidden>
          {avatarLetter(user?.username)}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="user-menu-backdrop"
            aria-label="关闭"
            onClick={() => setOpen(false)}
          />
          <div className="user-menu-panel" role="dialog" aria-label="我的">
            <div className="user-menu-head">
              <span className="user-avatar lg" aria-hidden>
                {avatarLetter(user?.username)}
              </span>
              <div>
                <div className="user-menu-name">{user?.username || "未登录"}</div>
                <div className="muted tiny">增长日记账户</div>
              </div>
            </div>

            <section className="user-menu-section">
              <h3 className="user-menu-title">账户</h3>
              {user ? (
                <>
                  <button
                    type="button"
                    className="user-menu-action"
                    onClick={() => {
                      setOpen(false);
                      nav("/settings");
                    }}
                  >
                    我的 · 密码设置
                  </button>
                  <button type="button" className="user-menu-action" onClick={onLogout}>
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="user-menu-action primary"
                  onClick={() => {
                    setOpen(false);
                    nav("/login");
                  }}
                >
                  登录
                </button>
              )}
            </section>

            <section className="user-menu-section">
              <h3 className="user-menu-title">UI 皮肤</h3>
              <div className="theme-grid">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-option ${themeId === t.id ? "active" : ""}`}
                    onClick={() => setThemeId(t.id)}
                    aria-pressed={themeId === t.id}
                  >
                    <span
                      className="theme-swatch"
                      style={{ background: t.swatch }}
                      aria-hidden
                    />
                    <span className="theme-name">{t.name}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
