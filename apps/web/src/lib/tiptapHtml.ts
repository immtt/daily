import { generateHTML as tiptapGenerateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { getReadExtensions } from "./editorExtensions";
import { normalizeContentStructure } from "./normalizeContent";
import { renderImageHtml } from "./images";

/** TipTap JSON → HTML，与编辑器扩展保持一致 */
export function generateHTML(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  try {
    const normalized = normalizeContentStructure(content) as JSONContent;
    return tiptapGenerateHTML(normalized, getReadExtensions());
  } catch {
    return legacyGenerateHTML(content);
  }
}

/** 兜底：官方渲染失败时使用 */
function legacyGenerateHTML(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const node = content as {
    type?: string;
    content?: unknown[];
    text?: string;
    marks?: Array<{ type: string }>;
    attrs?: Record<string, string>;
  };
  if (node.type === "text") {
    let t = escapeHtml(node.text || "").replace(/\n/g, "<br/>");
    for (const m of node.marks || []) {
      if (m.type === "bold") t = `<strong>${t}</strong>`;
      if (m.type === "italic") t = `<em>${t}</em>`;
      if (m.type === "code") t = `<code>${t}</code>`;
    }
    return t;
  }
  const kids = (node.content || []).map((c) => legacyGenerateHTML(c)).join("");
  switch (node.type) {
    case "doc":
      return kids;
    case "paragraph":
      return `<p>${kids || "<br/>"}</p>`;
    case "heading":
      return `<h${node.attrs?.level || 2}>${kids}</h${node.attrs?.level || 2}>`;
    case "bulletList":
      return `<ul>${kids}</ul>`;
    case "orderedList":
      return `<ol>${kids}</ol>`;
    case "listItem":
      return `<li>${kids}</li>`;
    case "blockquote":
      return `<blockquote>${kids}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${kids}</code></pre>`;
    case "image":
      return renderImageHtml(String(node.attrs?.src || ""));
    case "hardBreak":
      return "<br/>";
    case "horizontalRule":
      return "<hr/>";
    default:
      return kids;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
