import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { lockLife } from "../lib/lifeAccess";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [loginCurrent, setLoginCurrent] = useState("");
  const [loginNew, setLoginNew] = useState("");
  const [loginConfirm, setLoginConfirm] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginSaving, setLoginSaving] = useState(false);

  const [lifeEnablePwd, setLifeEnablePwd] = useState("");
  const [lifeEnableConfirm, setLifeEnableConfirm] = useState("");
  const [lifeCurrent, setLifeCurrent] = useState("");
  const [lifeNew, setLifeNew] = useState("");
  const [lifeNewConfirm, setLifeNewConfirm] = useState("");
  const [lifeDisablePwd, setLifeDisablePwd] = useState("");
  const [lifeMsg, setLifeMsg] = useState("");
  const [lifeErr, setLifeErr] = useState("");
  const [lifeSaving, setLifeSaving] = useState(false);

  async function onChangeLoginPassword(e: FormEvent) {
    e.preventDefault();
    setLoginMsg("");
    setLoginErr("");
    if (loginNew !== loginConfirm) {
      setLoginErr("两次输入的新密码不一致");
      return;
    }
    setLoginSaving(true);
    try {
      await api.changePassword(loginCurrent, loginNew);
      setLoginMsg("登录密码已更新");
      setLoginCurrent("");
      setLoginNew("");
      setLoginConfirm("");
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : "修改失败");
    } finally {
      setLoginSaving(false);
    }
  }

  async function onEnableLifeAccess(e: FormEvent) {
    e.preventDefault();
    setLifeMsg("");
    setLifeErr("");
    if (lifeEnablePwd.length < 4) {
      setLifeErr("生活栏目密码至少 4 位");
      return;
    }
    if (lifeEnablePwd !== lifeEnableConfirm) {
      setLifeErr("两次输入的密码不一致");
      return;
    }
    setLifeSaving(true);
    try {
      await api.updateLifeAccess({ enabled: true, password: lifeEnablePwd });
      lockLife();
      await refreshUser();
      setLifeMsg("生活栏目密码已启用");
      setLifeEnablePwd("");
      setLifeEnableConfirm("");
    } catch (err) {
      setLifeErr(err instanceof Error ? err.message : "设置失败");
    } finally {
      setLifeSaving(false);
    }
  }

  async function onChangeLifePassword(e: FormEvent) {
    e.preventDefault();
    setLifeMsg("");
    setLifeErr("");
    if (lifeNew.length < 4) {
      setLifeErr("新密码至少 4 位");
      return;
    }
    if (lifeNew !== lifeNewConfirm) {
      setLifeErr("两次输入的新密码不一致");
      return;
    }
    setLifeSaving(true);
    try {
      await api.updateLifeAccess({
        enabled: true,
        currentPassword: lifeCurrent,
        newPassword: lifeNew,
      });
      lockLife();
      await refreshUser();
      setLifeMsg("生活栏目密码已更新，下次进入需用新密码");
      setLifeCurrent("");
      setLifeNew("");
      setLifeNewConfirm("");
    } catch (err) {
      setLifeErr(err instanceof Error ? err.message : "修改失败");
    } finally {
      setLifeSaving(false);
    }
  }

  async function onDisableLifeAccess(e: FormEvent) {
    e.preventDefault();
    setLifeMsg("");
    setLifeErr("");
    setLifeSaving(true);
    try {
      await api.updateLifeAccess({
        enabled: false,
        currentPassword: lifeDisablePwd,
      });
      lockLife();
      await refreshUser();
      setLifeMsg("生活栏目密码保护已关闭");
      setLifeDisablePwd("");
    } catch (err) {
      setLifeErr(err instanceof Error ? err.message : "关闭失败");
    } finally {
      setLifeSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader
        left={
          <Link to="/" className="btn-ghost">
            ← 首页
          </Link>
        }
        center={<div className="brand-sm">我的</div>}
      />

      <main className="app-main settings-main">
        <section className="settings-card">
          <h2 className="settings-title">账户</h2>
          <p className="muted settings-desc">
            当前用户：<strong>{user?.username}</strong>
          </p>
        </section>

        <section className="settings-card">
          <h2 className="settings-title">登录密码</h2>
          <p className="muted settings-desc">修改用于登录增长日记的密码</p>
          <form className="settings-form" onSubmit={(e) => void onChangeLoginPassword(e)}>
            <label className="field">
              当前密码
              <input
                type="password"
                value={loginCurrent}
                onChange={(e) => setLoginCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="field">
              新密码
              <input
                type="password"
                value={loginNew}
                onChange={(e) => setLoginNew(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            <label className="field">
              确认新密码
              <input
                type="password"
                value={loginConfirm}
                onChange={(e) => setLoginConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            {loginErr && <p className="form-error">{loginErr}</p>}
            {loginMsg && <p className="settings-ok">{loginMsg}</p>}
            <button type="submit" className="btn-primary" disabled={loginSaving}>
              {loginSaving ? "保存中…" : "更新登录密码"}
            </button>
          </form>
        </section>

        <section className="settings-card">
          <h2 className="settings-title">生活栏目密码</h2>
          <p className="muted settings-desc">
            与生活栏目的情绪、记录内容解耦；启用后进入生活栏目需额外输入此密码。
          </p>
          <p className="settings-status">
            当前状态：
            <span
              className={
                user?.lifeAccessEnabled
                  ? "settings-status-on"
                  : "settings-status-off"
              }
            >
              {user?.lifeAccessEnabled ? "已启用" : "未启用"}
            </span>
          </p>

          {!user?.lifeAccessEnabled ? (
            <form className="settings-form" onSubmit={(e) => void onEnableLifeAccess(e)}>
              <label className="field">
                设置生活栏目密码
                <input
                  type="password"
                  value={lifeEnablePwd}
                  onChange={(e) => setLifeEnablePwd(e.target.value)}
                  autoComplete="new-password"
                  minLength={4}
                  placeholder="至少 4 位"
                  required
                />
              </label>
              <label className="field">
                确认密码
                <input
                  type="password"
                  value={lifeEnableConfirm}
                  onChange={(e) => setLifeEnableConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </label>
              {lifeErr && !user?.lifeAccessEnabled && (
                <p className="form-error">{lifeErr}</p>
              )}
              {lifeMsg && !user?.lifeAccessEnabled && (
                <p className="settings-ok">{lifeMsg}</p>
              )}
              <button type="submit" className="btn-primary" disabled={lifeSaving}>
                {lifeSaving ? "保存中…" : "启用生活栏目密码"}
              </button>
            </form>
          ) : (
            <>
              <form className="settings-form" onSubmit={(e) => void onChangeLifePassword(e)}>
                <h3 className="settings-subtitle">修改密码</h3>
                <label className="field">
                  当前生活栏目密码
                  <input
                    type="password"
                    value={lifeCurrent}
                    onChange={(e) => setLifeCurrent(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label className="field">
                  新密码
                  <input
                    type="password"
                    value={lifeNew}
                    onChange={(e) => setLifeNew(e.target.value)}
                    autoComplete="new-password"
                    minLength={4}
                    required
                  />
                </label>
                <label className="field">
                  确认新密码
                  <input
                    type="password"
                    value={lifeNewConfirm}
                    onChange={(e) => setLifeNewConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={4}
                    required
                  />
                </label>
                <button type="submit" className="btn-secondary" disabled={lifeSaving}>
                  {lifeSaving ? "保存中…" : "更新生活栏目密码"}
                </button>
              </form>

              <form
                className="settings-form settings-form--danger"
                onSubmit={(e) => void onDisableLifeAccess(e)}
              >
                <h3 className="settings-subtitle">关闭密码保护</h3>
                <label className="field">
                  当前生活栏目密码
                  <input
                    type="password"
                    value={lifeDisablePwd}
                    onChange={(e) => setLifeDisablePwd(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button type="submit" className="btn-danger" disabled={lifeSaving}>
                  {lifeSaving ? "处理中…" : "关闭生活栏目密码"}
                </button>
              </form>

              {lifeErr && user?.lifeAccessEnabled && (
                <p className="form-error">{lifeErr}</p>
              )}
              {lifeMsg && user?.lifeAccessEnabled && (
                <p className="settings-ok">{lifeMsg}</p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
