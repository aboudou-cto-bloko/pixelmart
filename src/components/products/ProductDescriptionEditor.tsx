// filepath: components/products/ProductDescriptionEditor.tsx

"use client";

import { RichTextEditor } from "./RichTextEditor";
import type { JSONContent } from "novel";

interface ProductDescriptionEditorProps {
  value: string; // Peut être du JSON TipTap ou du HTML legacy
  onChange: (json: string) => void; // Émet du JSON TipTap
}

/**
 * Extrait le texte brut depuis un document TipTap (format JSON)
 */
function extractTextFromJSON(node: JSONContent): string {
  let text = "";
  if (node.type === "text" && node.text) {
    text += node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += " " + extractTextFromJSON(child);
    }
  }
  return text.trim();
}

/**
 * Calcule la longueur du texte contenu dans une chaîne qui peut être
 * soit du JSON TipTap, soit du HTML (legacy).
 */
function getTextLength(content: string): number {
  if (!content) return 0;

  // Essayer de parser comme JSON TipTap
  try {
    const parsed = JSON.parse(content) as JSONContent;
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return extractTextFromJSON(parsed).length;
    }
  } catch {
    // Ce n'est pas du JSON -> traiter comme HTML
  }

  // Fallback: supprimer les balises HTML
  if (typeof window !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = content;
    return (div.textContent ?? "").length;
  }
  return content.replace(/<[^>]*>/g, "").length;
}

function CharCounter({ content }: { content: string }) {
  const count = getTextLength(content);

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
  return (
    <div className="space-y-2">
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder="Décrivez votre produit en détail pour maximiser les conversions..."
      />
      <CharCounter content={value} />
    </div>
  );
}
