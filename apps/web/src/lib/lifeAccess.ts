export const LIFE_ACCESS_PASSWORD = "ai";

/** 仅内存保存，离开生活栏目后失效 */
let lifeUnlocked = false;

export function isLifeUnlocked() {
  return lifeUnlocked;
}

export function unlockLife(password: string) {
  if (password.trim() !== LIFE_ACCESS_PASSWORD) return false;
  lifeUnlocked = true;
  return true;
}

export function lockLife() {
  lifeUnlocked = false;
}

export function getLifeAccessHeader(): Record<string, string> {
  return lifeUnlocked ? { "X-Life-Access": LIFE_ACCESS_PASSWORD } : {};
}

/** 生活栏目内路由：此范围内解锁状态保持，离开则需重新输入密码 */
export function isLifeEcosystemRoute(pathname: string, search: string) {
  if (pathname === "/life" || pathname.startsWith("/life/")) return true;
  if (pathname === "/trash") {
    return new URLSearchParams(search).get("domain") === "life";
  }
  // 生活废纸篓详情 ↔ 列表切换时不重复要密码
  if (/^\/trash\/[^/]+$/.test(pathname)) return true;
  return false;
}
