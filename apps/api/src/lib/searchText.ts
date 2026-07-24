/** 从 TipTap JSON 抽取纯文本，供关键字搜索 */
export function extractPlainText(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (typeof content !== "object") return String(content);
  const node = content as { text?: string; content?: unknown[] };
  const parts: string[] = [];
  if (typeof node.text === "string" && node.text) parts.push(node.text);
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const t = extractPlainText(child);
      if (t) parts.push(t);
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function buildSearchText(title: string, content: unknown): string {
  const body = extractPlainText(content);
  return `${title}\n${body}`.slice(0, 12000);
}
