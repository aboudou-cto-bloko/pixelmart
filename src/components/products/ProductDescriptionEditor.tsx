"use client";

import { RichTextEditor } from "./RichTextEditor";

interface ProductDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
}

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
        <span className="text-green-600">✓ Longueur idéale pour la conversion</span>
      )}
    </div>
  );
}

export function ProductDescriptionEditor({
  value,
  onChange,
}: ProductDescriptionEditorProps) {
  return (
    <div className="space-y-2">
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder="Décrivez votre produit en détail pour maximiser les conversions..."
      />
      <CharCounter html={value} />
    </div>
  );
}
