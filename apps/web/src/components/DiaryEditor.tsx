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
};

export function DiaryEditor({ value, onChange }: Props) {
  const lookupCache = useRef(new Map<string, string>());
  const timer = useRef<number | null>(null);
  const applying = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content:
      normalizeContentStructure((value as object) || {
        type: "doc",
        content: [],
      }) as object,
    onUpdate: ({ editor: ed }) => {
      if (applying.current) return;
      onChange(ed.getJSON());
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
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value ?? {});
    if (current !== next && value) {
      applying.current = true;
      editor.commands.setContent(
        normalizeContentStructure(value) as object
      );
      applying.current = false;
      window.setTimeout(() => {
        void autoTagify(editor);
      }, 200);
    }
  }, [value, editor]);

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
    if (applying.current) return;

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
      onChange(ed.getJSON());
      applying.current = false;
    } catch {
      // 保留已有内容，不打断输入
    }
  }

  async function insertImage() {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert("图片不能超过 5MB");
        return;
      }
      try {
        const { url } = await api.upload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (e) {
        alert(e instanceof Error ? e.message : "上传失败");
      }
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
        <button type="button" onClick={() => void insertImage()}>
          插图
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
