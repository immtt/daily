/** 从 TipTap JSON 提取图片 URL（去重保序） */
export function extractImageUrls(content: unknown): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as {
      type?: string;
      attrs?: { src?: string };
      content?: unknown[];
    };
    if (n.type === "image" && n.attrs?.src) {
      const src = String(n.attrs.src);
      if (src && !seen.has(src)) {
        seen.add(src);
        urls.push(src);
      }
    }
    if (Array.isArray(n.content)) {
      for (const c of n.content) walk(c);
    }
  }

  walk(content);
  return urls;
}
