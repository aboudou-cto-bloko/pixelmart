"use client";

import { useCallback } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";

interface ProductDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const TEMPLATES = [
  {
    label: "✨ Avantages clés",
    html: "<ul><li>Avantage 1</li><li>Avantage 2</li><li>Avantage 3</li></ul>",
  },
  {
    label: "📦 Ce qui est inclus",
    html: "<ul><li>Article principal</li><li>Accessoires inclus</li></ul>",
  },
  {
    label: "⚠️ Note importante",
    html: "<blockquote><p>Ajoutez ici une note importante concernant ce produit.</p></blockquote>",
  },
] as const;

function getTextLength(html: string): number {
  if (typeof window === "undefined") return 0;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").length;
}

function CharCounter({ html }: { html: string }) {
  const count = getTextLength(html);

  let countColor = "text-orange-500";
  if (count >= 150 && count <= 800) {
    countColor = "text-green-600";
  } else if (count > 2000) {
    countColor = "text-red-500";
  }

  const showSeoHint = count >= 300 && count <= 1000;

  return (
    <div className="flex items-center justify-between text-xs mt-1.5">
      <span className={countColor}>{count} caractères</span>
      {showSeoHint && (
        <span className="text-green-600">
          ✓ Longueur idéale pour la conversion
        </span>
      )}
    </div>
  );
}

export function ProductDescriptionEditor({
  value,
  onChange,
}: ProductDescriptionEditorProps) {
  // We need an editor instance to insert content at position
  // We use a ref-style approach by re-creating a hidden editor for template insertion
  const templateEditor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const insertTemplate = useCallback(
    (templateHtml: string) => {
      if (!templateEditor) return;
      templateEditor
        .chain()
        .focus()
        .insertContent(templateHtml)
        .run();
      onChange(templateEditor.getHTML());
    },
    [templateEditor, onChange],
  );

  return (
    <div className="space-y-2">
      {/* Quick templates */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((tpl) => (
          <Button
            key={tpl.label}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => insertTemplate(tpl.html)}
          >
            {tpl.label}
          </Button>
        ))}
      </div>

      {/* Main editor */}
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder="Décrivez votre produit en détail pour maximiser les conversions..."
      />

      {/* Character counter */}
      <CharCounter html={value} />
    </div>
  );
}
