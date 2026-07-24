const STORAGE_KEY = "growth_diary_life_unlock";

export const LIFE_ACCESS_PASSWORD = "ai";

export function isLifeUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockLife(password: string) {
  if (password.trim() !== LIFE_ACCESS_PASSWORD) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
  return true;
}

export function lockLife() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getLifeAccessHeader(): Record<string, string> {
  return isLifeUnlocked() ? { "X-Life-Access": LIFE_ACCESS_PASSWORD } : {};
}
