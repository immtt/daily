export const STOCK_CODE_RE = /\b([036]\d{5})\b/g;

export function extractCodesFromText(text: string): string[] {
  return [...new Set([...text.matchAll(STOCK_CODE_RE)].map((m) => m[1]))];
}

export function extractCodesFromContent(content: unknown): string[] {
  return extractCodesFromText(JSON.stringify(content ?? {}));
}

/** 在 TipTap JSON 正文中为股票代码/名称互相补全为「代码 名称」 */
export function enrichContentStocks(
  content: unknown,
  stocks: Array<{ code: string; name: string }>
): unknown {
  if (!content || typeof content !== "object") return content;
  const node = content as {
    type?: string;
    text?: string;
    content?: unknown[];
  };

  if (node.type === "text" && typeof node.text === "string") {
    let text = node.text;
    const sorted = [...stocks].sort((a, b) => b.name.length - a.name.length);
    for (const { code, name } of sorted) {
      if (!name || name === code) continue;
      const tagged = `${code} ${name}`;
      if (text.includes(tagged)) continue;
      text = text.replace(
        new RegExp(`\\b${escapeReg(code)}\\b(?!\\s+${escapeReg(name)})`, "g"),
        tagged
      );
      text = text.replace(
        new RegExp(`(?<![036]\\d{5}\\s)${escapeReg(name)}`, "g"),
        tagged
      );
    }
    return text === node.text ? node : { ...node, text };
  }

  if (!Array.isArray(node.content)) return content;
  return {
    ...node,
    content: node.content.map((c) => enrichContentStocks(c, stocks)),
  };
}

/** @deprecated 使用 enrichContentStocks */
export function enrichContentStockNames(
  content: unknown,
  nameMap: Map<string, string>
): unknown {
  const stocks = [...nameMap.entries()].map(([code, name]) => ({ code, name }));
  return enrichContentStocks(content, stocks);
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
