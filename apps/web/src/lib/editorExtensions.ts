import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extensions } from "@tiptap/core";

/** 详情页 HTML 渲染与编辑器共用的扩展（不含 Placeholder） */
export function getReadExtensions(): Extensions {
  return [
    StarterKit,
    Image.configure({ inline: false, allowBase64: false }),
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
