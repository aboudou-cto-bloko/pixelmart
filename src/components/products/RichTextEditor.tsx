"use client";

import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
  Link,
  Link2Off,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-1.5 rounded hover:bg-muted transition-colors",
        isActive && "bg-muted ring-1 ring-border",
      )}
      title={title}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-border mx-1 shrink-0" />;
}

function ImageNodeView({ node, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <div className="relative inline-block group max-w-full my-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) || ""}
          className="rounded-lg max-w-full h-auto block"
          style={{ maxHeight: "400px", objectFit: "contain" }}
        />
        <button
          type="button"
          contentEditable={false}
          onClick={() => deleteNode()}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-destructive text-white rounded-full p-1 transition-all"
          title="Supprimer l'image"
        >
          <X className="size-3" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Décrivez votre produit en détail pour maximiser les conversions...",
  className,
}: RichTextEditorProps) {
  const generateUploadUrl = useMutation(api.files.mutations.generateUploadUrl);
  const deleteFile = useMutation(api.files.mutations.deleteFile);
  const convex = useConvex();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Track storageId → src for uploaded images so we can delete on removal
  const uploadedImages = useRef<Map<string, string>>(new Map());
  // Stable ref to deleteFile so onUpdate closure doesn't go stale
  const deleteFileRef = useRef(deleteFile);
  deleteFileRef.current = deleteFile;
  // Guard: sync value into editor only once (when async data first arrives)
  const initializedRef = useRef(false);

  function extractImageSrcs(node: unknown, out: Set<string>) {
    if (!node || typeof node !== "object") return;
    const n = node as {
      type?: string;
      attrs?: { src?: string };
      content?: unknown[];
    };
    if (n.type === "image" && n.attrs?.src) out.add(n.attrs.src);
    n.content?.forEach((child) => extractImageSrcs(child, out));
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      TextStyle,
      Color,
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView);
        },
      }).configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
      // Detect images removed from editor and delete from storage
      const currentSrcs = new Set<string>();
      extractImageSrcs(ed.getJSON(), currentSrcs);
      for (const [storageId, src] of uploadedImages.current.entries()) {
        if (!currentSrcs.has(src)) {
          uploadedImages.current.delete(storageId);
          deleteFileRef
            .current({ storageId: storageId as Id<"_storage"> })
            .catch(() => {});
        }
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-4 focus:outline-none overflow-y-auto",
        style: "min-height: 200px; max-height: 500px;",
      },
    },
  });

  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien :", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetMark("link").run();
      return;
    }
    editor.chain().focus().setMark("link", { href: url }).run();
  }, [editor]);

  const handleRemoveLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetMark("link").run();
  }, [editor]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;

      setUploadingImage(true);
      try {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) return;
        const { storageId } = (await res.json()) as { storageId: string };
        const imageUrl = await convex.query(api.files.queries.getUrl, {
          storageId,
        });
        if (!imageUrl) return;
        uploadedImages.current.set(storageId, imageUrl);
        editor
          .chain()
          .focus()
          .setImage({ src: imageUrl, alt: file.name })
          .run();
      } finally {
        setUploadingImage(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [editor, generateUploadUrl, convex],
  );

  // Sync async value into editor once it arrives (editor initializes with empty string)
  useEffect(() => {
    if (!editor || !value || initializedRef.current) return;
    editor.commands.setContent(value, { emitUpdate: false });
    initializedRef.current = true;
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden flex flex-col",
        className,
      )}
    >
      {/* Sticky Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/50 sticky top-0 z-10">
        {/* Text formatting group */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Gras"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italique"
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Souligné"
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Barré"
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Headings group */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Titre H2"
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title="Titre H3"
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists group */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Liste à puces"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Liste numérotée"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Alignment group */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Aligner à gauche"
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Centrer"
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Aligner à droite"
        >
          <AlignRight className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Link group */}
        <ToolbarButton onClick={handleInsertLink} title="Insérer un lien">
          <Link className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleRemoveLink} title="Supprimer le lien">
          <Link2Off className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Color group */}
        <div className="relative flex items-center" title="Couleur du texte">
          <input
            type="color"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            className="w-7 h-7 rounded cursor-pointer border border-border bg-background p-0.5"
            title="Couleur du texte"
          />
        </div>

        <ToolbarSeparator />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          title="Effacer la mise en forme"
        >
          <RemoveFormatting className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Image upload */}
        <ToolbarButton
          onClick={() => imageInputRef.current?.click()}
          title="Insérer une image"
        >
          {uploadingImage ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </ToolbarButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      </div>

      {/* Editor content area */}
      <div className="relative flex-1">
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-muted-foreground text-sm pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
