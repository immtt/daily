import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getEditorExtensions } from "../lib/editorExtensions";
import { normalizeContentStructure } from "../lib/normalizeContent";
import { api } from "../api/client";
import { enrichContentStocks } from "../lib/stockText";
import { extractImageUrls } from "../lib/images";
import { ImageLightbox } from "./ImageLightbox";

type Props = {
  value: unknown;
  onChange: (json: unknown) => void;
  enableStockTagify?: boolean;
  placeholder?: string;
};

export function DiaryEditor({
  value,
  onChange,
  enableStockTagify = true,
  placeholder,
}: Props) {
  const lookupCache = useRef(new Map<string, string>());
  const timer = useRef<number | null>(null);
  const applying = useRef(false);
  const lastEditorJson = useRef("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: getEditorExtensions(placeholder),
    content:
      normalizeContentStructure((value as object) || {
        type: "doc",
        content: [],
      }) as object,
    onUpdate: ({ editor: ed }) => {
      if (applying.current) return;
      const json = ed.getJSON();
      lastEditorJson.current = JSON.stringify(json);
      onChange(json);
      if (!enableStockTagify) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        void autoTagify(ed);
      }, 400);
    },
  });

  const imageUrls = useMemo(
    () => extractImageUrls(editor?.getJSON() ?? value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, value, editor?.state.doc.content.size]
  );

  useEffect(() => {
    if (!editor || applying.current) return;
    const valueJson = JSON.stringify(value ?? {});
    if (valueJson === lastEditorJson.current) return;
    const currentJson = JSON.stringify(editor.getJSON());
    if (currentJson === valueJson) {
      lastEditorJson.current = valueJson;
      return;
    }
    if (value) {
      applying.current = true;
      editor.commands.setContent(
        normalizeContentStructure(value) as object
      );
      lastEditorJson.current = JSON.stringify(editor.getJSON());
      applying.current = false;
      if (enableStockTagify) {
        window.setTimeout(() => {
          void autoTagify(editor);
        }, 200);
      }
    }
  }, [value, editor, enableStockTagify]);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName !== "IMG" || !t.closest(".editor-body")) return;
      const src =
        (t as HTMLImageElement).currentSrc || (t as HTMLImageElement).src;
      const urls = extractImageUrls(editor?.getJSON() ?? value);
      if (!urls.length) return;
      e.preventDefault();
      e.stopPropagation();
      let idx = urls.findIndex(
        (u) => u === src || src.endsWith(u) || src.includes(u)
      );
      if (idx < 0) idx = 0;
      setPreviewIndex(idx);
    }
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [editor, value]);

  async function autoTagify(ed: NonNullable<typeof editor>) {
    if (!enableStockTagify || applying.current) return;

    const json = ed.getJSON();
    const text = ed.getText();
    if (!text.trim()) return;

    try {
      const res = await api.resolveStocksInText(text);
      for (const s of res.items) {
        lookupCache.current.set(s.code, s.name);
      }
      if (res.items.length === 0) return;

      const enriched = enrichContentStocks(json, res.items);
      if (JSON.stringify(enriched) === JSON.stringify(json)) return;

      applying.current = true;
      ed.commands.setContent(enriched as object);
      const updated = ed.getJSON();
      lastEditorJson.current = JSON.stringify(updated);
      onChange(updated);
      applying.current = false;
    } catch {
      // 保留已有内容，不打断输入
    }
  }

  async function insertImage() {
    if (!editor || uploading) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files?.length) return;

      const valid: File[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} 超过 5MB，已跳过`);
          continue;
        }
        valid.push(file);
      }
      if (!valid.length) return;

      setUploading(true);
      const ordered: Array<{ index: number; url: string } | { index: number; error: string }> =
        await Promise.all(
          valid.map(async (file, index) => {
            try {
              const { url } = await api.upload(file);
              return { index, url };
            } catch (e) {
              return {
                index,
                error: e instanceof Error ? e.message : `${file.name} 上传失败`,
              };
            }
          })
        );

      setUploading(false);

      const errors = ordered
        .filter((r): r is { index: number; error: string } => "error" in r)
        .map((r) => r.error);
      if (errors.length) alert(errors.join("\n"));

      const urls = ordered
        .filter((r): r is { index: number; url: string } => "url" in r)
        .sort((a, b) => a.index - b.index)
        .map((r) => r.url);

      if (!urls.length) return;

      const imageNodes = urls.map((src) => ({
        type: "image" as const,
        attrs: { src },
      }));

      // 在当前块之后批量插入，避免选中图片时被替换
      const insertPos = Math.min(
        editor.state.selection.$to.after(),
        editor.state.doc.content.size
      );

      applying.current = true;
      const ok = editor
        .chain()
        .focus()
        .insertContentAt(insertPos, imageNodes)
        .run();
      if (ok) {
        const json = editor.getJSON();
        lastEditorJson.current = JSON.stringify(json);
        onChange(json);
      }
      applying.current = false;
    };
    input.click();
  }

  if (!editor) return null;

  return (
    <div className="editor-wrap" ref={wrapRef}>
      <div className="editor-toolbar">
        <button
          type="button"
          className={editor.isActive("bold") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          加粗
        </button>
        <button
          type="button"
          className={editor.isActive("bulletList") ? "active" : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          列表
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => void insertImage()}
        >
          {uploading ? "上传中…" : "插图（可多选）"}
        </button>
      </div>
      <EditorContent editor={editor} className="editor-body entry-body" />
      {previewIndex != null && imageUrls.length > 0 && (
        <ImageLightbox
          urls={imageUrls}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onIndexChange={setPreviewIndex}
        />
      )}
    </div>
  );
}

export { extractCodesFromContent } from "../lib/stockText";
