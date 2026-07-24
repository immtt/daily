import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extensions } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/core";
import { imageDisplaySrc } from "./images";

const DiaryImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-full-src") ||
          element.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return {
            src: el.getAttribute("data-full-src") || el.getAttribute("src"),
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src || "");
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        src: imageDisplaySrc(src),
        "data-full-src": src,
        loading: "lazy",
        decoding: "async",
        onerror:
          "if(this.dataset.fullSrc){this.onerror=null;this.src=this.dataset.fullSrc}",
      }),
    ];
  },
});

/** 详情页 HTML 渲染与编辑器共用的扩展（不含 Placeholder） */
export function getReadExtensions(): Extensions {
  return [
    StarterKit,
    DiaryImage.configure({ inline: false, allowBase64: false }),
  ];
}

/** 编辑页扩展 */
export function getEditorExtensions(placeholder?: string): Extensions {
  return [
    ...getReadExtensions(),
    Placeholder.configure({
      placeholder:
        placeholder ??
        "写下今日复盘…输入股票代码或名称，自动带出对应信息",
    }),
  ];
}
