import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { api } from "../api/client";

type Props = {
  value: unknown;
  onChange: (json: unknown) => void;
};

const CODE_RE = /\b([036]\d{5})\b/g;

export function DiaryEditor({ value, onChange }: Props) {
  const lookupCache = useRef(new Map<string, string>());
  const timer = useRef<number | null>(null);
  const applying = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: "写下今日复盘…输入股票代码自动带出名称",
      }),
    ],
    content: (value as object) || { type: "doc", content: [] },
    onUpdate: ({ editor: ed }) => {
      if (applying.current) return;
      onChange(ed.getJSON());
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        void autoTagify(ed);
      }, 500);
    },
  });

  useEffect(() => {
    if (!editor || applying.current) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value ?? {});
    if (current !== next && value) {
      applying.current = true;
      editor.commands.setContent(value as object);
      applying.current = false;
    }
  }, [value, editor]);

  async function autoTagify(ed: NonNullable<typeof editor>) {
    const text = ed.getText();
    const codes = [...new Set([...text.matchAll(CODE_RE)].map((m) => m[1]))];
    if (codes.length === 0) return;

    const missing = codes.filter((c) => !lookupCache.current.has(c));
    if (missing.length) {
      try {
        const res = await api.lookupStocks(missing);
        for (const s of res.items) lookupCache.current.set(s.code, s.name);
        for (const c of missing) {
          if (!lookupCache.current.has(c)) lookupCache.current.set(c, c);
        }
      } catch {
        return;
      }
    }

    let next = text;
    let changed = false;
    for (const code of codes) {
      const name = lookupCache.current.get(code);
      if (!name || name === code) continue;
      const tagged = `${code} ${name}`;
      if (next.includes(tagged)) continue;
      // only replace standalone code not already followed by name
      const re = new RegExp(`\\b${code}\\b(?!\\s+${escapeReg(name)})`, "g");
      if (re.test(next)) {
        next = next.replace(re, tagged);
        changed = true;
      }
    }
    if (!changed) return;

    // Rebuild as simple paragraphs preserving line breaks
    const paragraphs = next.split(/\n+/).map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    }));
    applying.current = true;
    ed.commands.setContent({ type: "doc", content: paragraphs });
    onChange(ed.getJSON());
    applying.current = false;
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
    <div className="editor-wrap">
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
      <EditorContent editor={editor} className="editor-body" />
    </div>
  );
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractCodesFromContent(content: unknown): string[] {
  const text = JSON.stringify(content ?? {});
  return [...new Set([...text.matchAll(CODE_RE)].map((m) => m[1]))];
}
