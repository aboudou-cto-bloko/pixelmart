"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import {
  StarterKit,
  TiptapUnderline,
  TextStyle,
  Color,
  HighlightExtension,
  TiptapLink,
  TiptapImage,
  type JSONContent,
} from "novel";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";

// Extensions must match the editor's to ensure correct HTML generation
const viewerExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  TiptapUnderline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
  Color,
  HighlightExtension.configure({ multicolor: true }),
  TiptapLink.configure({
    autolink: false,
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  }),
  TiptapImage.configure({
    inline: false,
    allowBase64: false,
  }),
];

function parseContent(
  value: string,
): { type: "json"; data: JSONContent } | { type: "html"; data: string } {
  if (!value) return { type: "html", data: "" };
  try {
    const parsed = JSON.parse(value) as JSONContent;
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return { type: "json", data: parsed };
    }
  } catch {
    // Not JSON — treat as legacy HTML
  }
  return { type: "html", data: value };
}

interface RichTextViewerProps {
  content: string;
  className?: string;
}

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  const html = useMemo(() => {
    const parsed = parseContent(content);
    if (parsed.type === "html") return parsed.data;
    return generateHTML(parsed.data, viewerExtensions);
  }, [content]);

  return (
    <div
      className={cn(
        "prose prose-sm sm:prose-base max-w-none",
        "prose-headings:text-foreground prose-headings:font-semibold",
        "prose-p:text-muted-foreground prose-p:leading-relaxed",
        "prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80",
        "prose-strong:text-foreground",
        "prose-img:rounded-lg prose-img:max-w-full prose-img:mx-auto",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-mark:bg-yellow-200 prose-mark:px-1 prose-mark:rounded-sm",
        "prose-ul:list-disc prose-ol:list-decimal",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
