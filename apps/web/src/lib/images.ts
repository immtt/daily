/** 原图 URL → 缩略图 URL（约定：同 id 的 _t.webp） */
export function imageThumbUrl(src: string): string {
  const m = src.match(/^(.+)\.(jpe?g|png|webp)$/i);
  if (!m) return src;
  return `${m[1]}_t.webp`;
}

/** 列表/正文展示用缩略图；Lightbox 仍用原图 attrs.src */
export function imageDisplaySrc(src: string): string {
  return imageThumbUrl(src);
}

const IMG_ATTRS =
  'loading="lazy" decoding="async" onerror="if(this.dataset.fullSrc){this.onerror=null;this.src=this.dataset.fullSrc}"';

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

export function renderImageHtml(src: string): string {
  if (!src) return "";
  const thumb = imageThumbUrl(src);
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return `<img src="${esc(thumb)}" data-full-src="${esc(src)}" alt="" ${IMG_ATTRS} />`;
}
