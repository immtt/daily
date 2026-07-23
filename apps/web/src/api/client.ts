export type User = {
  id: string;
  username: string;
  role: "admin" | "user";
  status?: string;
};

export type StockRef = { code: string; name: string };

export type MarketSnapshot = {
  date: string;
  tradeDate?: string;
  snapshotType: "intraday" | "close";
  snapshotAt: string;
  indices: Array<{
    id: string;
    name: string;
    point: number;
    changeAmt: number;
    changePct: number;
  }>;
  breadth: { rise: number; fall: number };
  turnover: number;
  capitalInflow: number;
  available: boolean;
  message?: string;
};

export type DiaryEntry = {
  id: string;
  title: string;
  entryDate: string;
  stocks: StockRef[];
  pnlDay: number | null;
  pnlTotal: number | null;
  mood: string | null;
  marketSnapshot?: MarketSnapshot | null;
  content?: unknown;
  createdAt: string;
  updatedAt: string;
};

type ApiError = { error?: string; code?: string };

const TOKEN_KEY = "stock_diary_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login";
      }
    }
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<User>("/auth/me"),
  listEntries: (params: Record<string, string>) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v)
    ).toString();
    return request<{
      items: DiaryEntry[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/entries?${qs}`);
  },
  getEntry: (id: string) => request<DiaryEntry>(`/entries/${id}`),
  createEntry: (body: unknown) =>
    request<DiaryEntry>("/entries", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateEntry: (id: string, body: unknown) =>
    request<DiaryEntry>(`/entries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteEntry: (id: string) =>
    request<void>(`/entries/${id}`, { method: "DELETE" }),
  market: (date: string) =>
    request<MarketSnapshot>(`/market/indices?date=${date}`),
  lookupStocks: (codes: string[]) =>
    request<{ items: StockRef[] }>(
      `/stocks/lookup?codes=${codes.join(",")}`
    ),
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/uploads", {
      method: "POST",
      body: fd,
    });
  },
};
