/** 生活栏目解锁：仅内存保存，离开栏目后失效 */
let lifeUnlocked = false;
let lifeSessionPassword: string | null = null;

export function isLifeUnlocked() {
  return lifeUnlocked;
}

export function lockLife() {
  lifeUnlocked = false;
  lifeSessionPassword = null;
}

export function markLifeUnlocked(password: string | null) {
  lifeUnlocked = true;
  lifeSessionPassword = password;
}

export function getLifeAccessHeader(): Record<string, string> {
  if (!lifeUnlocked || !lifeSessionPassword) return {};
  return { "X-Life-Access": lifeSessionPassword };
}

/** 生活栏目内路由：此范围内解锁状态保持，离开则需重新输入密码 */
export function isLifeEcosystemRoute(pathname: string, search: string) {
  if (pathname === "/life" || pathname.startsWith("/life/")) return true;
  if (pathname === "/trash") {
    return new URLSearchParams(search).get("domain") === "life";
  }
  if (/^\/trash\/[^/]+$/.test(pathname)) return true;
  return false;
}
