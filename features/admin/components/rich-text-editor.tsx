"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { memo, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// Why this is memo(() => true):
// The listing form is ~1700 lines with dozens of state vars. Every character
// typed here → debounced onChange → parent setDescription → parent re-render,
// which cascaded back into re-rendering this component AND running TipTap's
// internal reconciliation. That's what made typing visibly laggy.
//
// The editor is now self-contained after mount: it captures `value` once via
// the useEditor `content` option and never re-syncs from prop changes. React
// never re-renders this component after the initial mount, so parent updates
// stay entirely inside the parent. onChange is read through a ref so the
// latest handler is always called.
//
// If a caller ever needs to reset the editor with new content, remount it
// with a React `key` prop (e.g. `key={listingId}` when switching listings) —
// don't try to push a new `value` prop; it will be ignored by design.
const ONCHANGE_DEBOUNCE_MS = 300;

function RichTextEditorInner({ value, onChange, minHeight = 400 }: Props) {
  // Ref-based handler so the debounce closure below always calls the latest
  // onChange without needing this component to re-render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          bulletList: { HTMLAttributes: { class: "list-disc pl-6" } },
          orderedList: { HTMLAttributes: { class: "list-decimal pl-6" } },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-orange underline hover:text-orange/80" },
        }),
        Image.configure({
          HTMLAttributes: { class: "max-w-full h-auto my-4" },
        }),
      ],
      content: value,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          // spellcheck=false: browser spellcheck on a large contenteditable is
          //   expensive and was contributing to visible typing lag in the
          //   ~1700-line listing form (plain <textarea> nearby was fine).
          //   Copywriters can rely on their OS keyboard/editor for spelling.
          // contain: layout paint: scopes reflow/repaint to the editor so
          //   growing the contenteditable doesn't reflow the whole form
          //   below it on every keystroke.
          class: "max-w-none font-sans text-sm text-ink focus:outline-none px-4 py-3",
          style: `min-height: ${minHeight}px; contain: layout paint;`,
          spellcheck: "false",
        },
        handleDOMEvents: {
          blur: (view) => {
            // Flush pending debounced update on blur so save-then-blur never
            // loses the tail of what the user typed.
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
              debounceRef.current = null;
              onChangeRef.current(view.dom.innerHTML);
            }
            return false;
          },
        },
      },
      onUpdate: ({ editor }) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onChangeRef.current(editor.getHTML());
          debounceRef.current = null;
        }, ONCHANGE_DEBOUNCE_MS);
      },
    },
    // Empty deps: initialise once, ignore later prop changes. See file-top
    // comment — reset via React `key` remount if you ever need to.
    [],
  );

  // Clear the debounce on unmount so we don't call setState on an unmounted
  // parent, and don't fire onChange after teardown.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="border border-line bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

// Never re-render on parent updates. The editor is imperatively controlled
// after mount; new `value`/`onChange`/`minHeight` props from the parent are
// intentionally ignored (onChange stays fresh via ref). See file-top comment.
export const RichTextEditor = memo(RichTextEditorInner, () => true);

function Toolbar({ editor }: { editor: Editor }) {
  const Btn = ({
    active,
    disabled,
    onClick,
    title,
    children,
  }: {
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 min-w-[32px] px-2 flex items-center justify-center font-mono text-[12px] border-r border-line transition-colors ${
        active ? "bg-navy text-white" : "bg-white text-ink hover:bg-cream-alt"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-stretch border-b border-line bg-white">
      <Btn
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </Btn>
      <Btn
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </Btn>
      <Btn
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </Btn>
      <Btn
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Btn>
      <Btn
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Btn>
      <Btn
        title="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </Btn>
      <Btn
        title="Bullet List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </Btn>
      <Btn
        title="Ordered List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </Btn>
      <Btn
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </Btn>
      <Btn
        title="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Link URL", previous ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        🔗
      </Btn>
      <Btn
        title="Image"
        onClick={() => {
          const url = window.prompt("Image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
      >
        🖼
      </Btn>
      <Btn
        title="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        ―
      </Btn>
      <Btn
        title="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </Btn>
      <Btn
        title="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </Btn>
      <Btn
        title="Clear formatting"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      >
        ⌫
      </Btn>
    </div>
  );
}
