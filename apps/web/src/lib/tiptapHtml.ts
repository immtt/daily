/** Minimal TipTap JSON → HTML for read-only detail view */
export function generateHTML(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const node = content as { type?: string; content?: unknown[]; text?: string; marks?: Array<{ type: string }>; attrs?: Record<string, string> };
  if (node.type === "text") {
    let t = escapeHtml(node.text || "");
    for (const m of node.marks || []) {
      if (m.type === "bold") t = `<strong>${t}</strong>`;
      if (m.type === "italic") t = `<em>${t}</em>`;
      if (m.type === "code") t = `<code>${t}</code>`;
    }
    return t;
  }
  const kids = (node.content || []).map((c) => generateHTML(c)).join("");
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
    case "image":
      return `<img src="${escapeAttr(node.attrs?.src || "")}" alt="" />`;
    case "hardBreak":
      return "<br/>";
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

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
