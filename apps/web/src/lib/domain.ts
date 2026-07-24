export type EntryDomain = "stock" | "reading" | "life";

export const ENTRY_DOMAINS: Array<{
  id: EntryDomain;
  label: string;
  hint: string;
  icon: string;
}> = [
  {
    id: "stock",
    label: "股票",
    hint: "复盘、心法、盈亏与大盘",
    icon: "📈",
  },
  {
    id: "reading",
    label: "读书",
    hint: "读书笔记与摘录",
    icon: "📚",
  },
  {
    id: "life",
    label: "生活",
    hint: "日常记录与情绪",
    icon: "🌿",
  },
];

export function isEntryDomain(v: string): v is EntryDomain {
  return v === "stock" || v === "reading" || v === "life";
}

export function domainLabel(id: string | null | undefined) {
  return ENTRY_DOMAINS.find((d) => d.id === id)?.label ?? "股票";
}

export function domainBasePath(domain: EntryDomain) {
  return `/${domain}`;
}

export function domainListPath(domain: EntryDomain) {
  return domainBasePath(domain);
}

export function domainNewPath(domain: EntryDomain) {
  return `${domainBasePath(domain)}/new`;
}

export function domainDetailPath(domain: EntryDomain, id: string) {
  return `${domainBasePath(domain)}/${id}`;
}

export function domainEditPath(domain: EntryDomain, id: string) {
  return `${domainBasePath(domain)}/${id}/edit`;
}

export function trashPath(domain?: EntryDomain | "") {
  return domain ? `/trash?domain=${domain}` : "/trash";
}

export function resolveEntryDomain(entry: { domain?: string | null }): EntryDomain {
  if (entry.domain === "reading" || entry.domain === "life") return entry.domain;
  return "stock";
}
