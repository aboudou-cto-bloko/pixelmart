"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Décrivez votre produit...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["paragraph"],
      }),
      TextStyle,
      Color,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[150px] p-4 focus:outline-none",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded hover:bg-muted",
            editor.isActive("bold") && "bg-muted font-bold",
          )}
          title="Gras"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded hover:bg-muted",
            editor.isActive("italic") && "bg-muted italic",
          )}
          title="Italique"
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-1.5 rounded hover:bg-muted",
            editor.isActive("underline") && "bg-muted underline",
          )}
          title="Souligné"
        >
          <UnderlineIcon className="size-4" />
        </button>
        <input
          type="color"
          onChange={(e) => editor.commands.setColor(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0"
          title="Couleur du texte"
        />

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "p-1.5 rounded hover:bg-muted",
            editor.isActive({ textAlign: "left" }) && "bg-muted",
          )}
          title="Aligner à gauche"
        >
          <AlignLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "p-1.5 rounded hover:bg-muted",
            editor.isActive({ textAlign: "center" }) && "bg-muted",
          )}
          title="Centrer"
        >
          <AlignCenter className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "p-1.5 rounded hover:bg-muted",
            editor.isActive({ textAlign: "right" }) && "bg-muted",
          )}
          title="Aligner à droite"
        >
          <AlignRight className="size-4" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
