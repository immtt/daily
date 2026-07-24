type JsonNode = {
  type?: string;
  text?: string;
  marks?: unknown[];
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
};

/** 把正文里的换行、裸文本节点规范成 TipTap 可识别的段落结构 */
export function normalizeContentStructure(content: unknown): unknown {
  if (!content || typeof content !== "object") return content;
  const node = content as JsonNode;

  if (node.type === "doc" && Array.isArray(node.content)) {
    const next: JsonNode[] = [];
    for (const child of node.content) {
      if (child?.type === "text" && typeof child.text === "string") {
        next.push(...splitTextBlockToParagraphs(child.text, child.marks));
        continue;
      }
      next.push(normalizeBlock(child));
    }
    return { ...node, content: next };
  }

  if (Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map((child) => normalizeBlock(child)),
    };
  }

  return node;
}

function normalizeBlock(node: JsonNode): JsonNode {
  if (!node || typeof node !== "object") return node;

  if (node.type === "paragraph" && Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.flatMap((child) => expandTextNewlines(child)),
    };
  }

  if (Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map((child) => normalizeBlock(child)),
    };
  }

  return node;
}

function splitTextBlockToParagraphs(
  text: string,
  marks?: unknown[]
): JsonNode[] {
  const blocks = text.split(/\n{2,}/);
  if (blocks.length <= 1) {
    return [{ type: "paragraph", content: expandTextNewlines({ type: "text", text, marks }) }];
  }
  return blocks
    .map((block) => block.replace(/^\n+|\n+$/g, ""))
    .filter((block) => block.length > 0)
    .map((block) => ({
      type: "paragraph",
      content: expandTextNewlines({ type: "text", text: block, marks }),
    }));
}

function expandTextNewlines(node: JsonNode): JsonNode[] {
  if (node.type !== "text" || typeof node.text !== "string") return [node];
  if (!node.text.includes("\n")) return [node];

  const lines = node.text.split("\n");
  const out: JsonNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0) {
      out.push({ ...node, text: lines[i] });
    }
    if (i < lines.length - 1) {
      out.push({ type: "hardBreak" });
    }
  }
  return out.length > 0 ? out : [{ type: "text", text: "", marks: node.marks }];
}
