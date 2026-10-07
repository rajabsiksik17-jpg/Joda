"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, RemoveFormatting, Underline, Undo2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdminI18n } from "../i18n";
import { MediaBrowser } from "../media/media-browser";
import { Button, Input, Modal } from "../ui";

function ToolButton({ active, onClick, label, children, disabled }: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn("grid size-8 place-items-center rounded text-slate transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40", active && "bg-sky-100 text-tech-700")}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, dir }: { editor: Editor; dir: "rtl" | "ltr" }) {
  const { tx } = useAdminI18n();
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [href, setHref] = useState("");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"), h2: e.isActive("heading", { level: 2 }), h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"), ordered: e.isActive("orderedList"), quote: e.isActive("blockquote"), link: e.isActive("link"),
      left: e.isActive({ textAlign: "left" }), center: e.isActive({ textAlign: "center" }), right: e.isActive({ textAlign: "right" }),
      canUndo: e.can().undo(), canRedo: e.can().redo(),
    }),
  });
  const applyLink = () => {
    const v = href.trim();
    if (!v) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else if (/^(https?:\/\/|\/|mailto:|tel:|#)/i.test(v)) editor.chain().focus().extendMarkRange("link").setLink({ href: v }).run();
    setLinkOpen(false);
  };
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-white/95 p-1.5 backdrop-blur" dir="ltr">
      <ToolButton label={tx("Heading", "عنوان")} active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolButton>
      <ToolButton label={tx("Subheading", "عنوان فرعي")} active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolButton label={tx("Bold", "عريض")} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolButton>
      <ToolButton label={tx("Italic", "مائل")} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolButton>
      <ToolButton label={tx("Underline", "تسطير")} active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline className="size-4" /></ToolButton>
      <ToolButton label={tx("Link", "رابط")} active={state.link} onClick={() => { setHref(editor.getAttributes("link").href ?? ""); setLinkOpen(true); }}><Link2 className="size-4" /></ToolButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolButton label={tx("Bulleted list", "قائمة نقطية")} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolButton>
      <ToolButton label={tx("Numbered list", "قائمة مرقمة")} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolButton>
      <ToolButton label={tx("Quote", "اقتباس")} active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolButton>
      <ToolButton label={tx("Divider", "فاصل")} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolButton>
      <ToolButton label={tx("Image", "صورة")} onClick={() => setImageOpen(true)}><ImagePlus className="size-4" /></ToolButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolButton label={tx("Align left", "محاذاة لليسار")} active={state.left} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="size-4" /></ToolButton>
      <ToolButton label={tx("Center", "توسيط")} active={state.center} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="size-4" /></ToolButton>
      <ToolButton label={tx("Align right", "محاذاة لليمين")} active={state.right} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="size-4" /></ToolButton>
      <ToolButton label={tx("Clear formatting", "إزالة التنسيق")} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting className="size-4" /></ToolButton>
      <span className="ms-auto flex">
        <ToolButton label={tx("Undo", "تراجع")} disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolButton>
        <ToolButton label={tx("Redo", "إعادة")} disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolButton>
      </span>
      <Modal open={linkOpen} onOpenChange={setLinkOpen} title={tx("Insert link", "إدراج رابط")} size="sm" footer={<><Button onClick={() => setLinkOpen(false)}>{tx("Cancel", "إلغاء")}</Button><Button variant="primary" onClick={applyLink}>{tx("Apply", "تطبيق")}</Button></>}>
        <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://… / /ar/contact / mailto:…" dir="ltr" autoFocus onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyLink())} />
        <p className="mt-2 text-xs text-muted">{tx("Leave empty to remove the link.", "اتركه فارغاً لإزالة الرابط.")}</p>
      </Modal>
      <Modal open={imageOpen} onOpenChange={setImageOpen} title={tx("Insert image", "إدراج صورة")} size="xl">
        {imageOpen && (
          <MediaBrowser
            mode="pick"
            accept="image"
            onPick={(m) => {
              editor.chain().focus().setImage({ src: m.url, alt: m.alt?.[dir === "rtl" ? "ar" : "en"] ?? "" }).run();
              setImageOpen(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

export default function RichTextEditor({ value, onChange, dir, lang, minHeight = 220 }: { value: string; onChange: (html: string) => void; dir: "rtl" | "ltr"; lang: string; minHeight?: number }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto", "tel"] } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ inline: false }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "prose-qe max-w-none px-4 py-3 focus:outline-none text-[0.95rem]", dir, lang, style: `min-height:${minHeight}px` },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  // Sync when the value is replaced externally (e.g. restoring a revision).
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(editor.isEmpty && !value)) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-md border border-line-strong bg-white focus-within:border-tech focus-within:ring-2 focus-within:ring-tech/20">
      {editor && <Toolbar editor={editor} dir={dir} />}
      <EditorContent editor={editor} />
    </div>
  );
}
