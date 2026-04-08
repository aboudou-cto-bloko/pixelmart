"use client";

import {
  EditorRoot,
  EditorContent,
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  ImageResizer,
  handleImageDrop,
  handleImagePaste,
  handleCommandNavigation,
  createImageUpload,
  createSuggestionItems,
  renderItems,
  type SuggestionItem,
  type JSONContent,
} from "novel";
import {
  StarterKit,
  Placeholder,
  TiptapLink,
  TiptapImage,
  UpdatedImage,
  HighlightExtension,
  TiptapUnderline,
  TextStyle,
  Command,
  Color,
} from "novel";
import TextAlign from "@tiptap/extension-text-align";
import type { EditorInstance } from "novel";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Link,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, useEffect, useMemo } from "react";

// ─── Types ──────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string; // JSON stringified TipTap content
  onChange: (json: string) => void;
  placeholder?: string;
  className?: string;
}

// ─── Image upload via Convex ────────────────────────────────

function useConvexImageUpload() {
  const generateUploadUrl = useMutation(api.files.mutations.generateUploadUrl);
  const convex = useConvex();
  const uploadedImages = useRef<Map<string, string>>(new Map());

  const onUpload = useCallback(
    async (file: File): Promise<string> => {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: string };
      const imageUrl = await convex.query(api.files.queries.getUrl, {
        storageId,
      });
      if (!imageUrl) throw new Error("Could not get image URL");
      uploadedImages.current.set(storageId, imageUrl);
      return imageUrl;
    },
    [generateUploadUrl, convex],
  );

  return { onUpload, uploadedImages };
}

// ─── Slash command items ────────────────────────────────────

function createSlashItems(onImageUpload: () => void): SuggestionItem[] {
  return createSuggestionItems([
    {
      title: "Texte",
      description: "Paragraphe simple",
      searchTerms: ["p", "paragraph", "texte"],
      icon: <RemoveFormatting className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .run();
      },
    },
    {
      title: "Titre 1",
      description: "Grand titre de section",
      searchTerms: ["title", "titre", "big", "h1"],
      icon: <Heading1 className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Titre 2",
      description: "Titre moyen",
      searchTerms: ["subtitle", "sous-titre", "h2"],
      icon: <Heading2 className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Titre 3",
      description: "Petit titre",
      searchTerms: ["subtitle", "h3"],
      icon: <Heading3 className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Liste a puces",
      description: "Liste non ordonnee",
      searchTerms: ["unordered", "bullet", "puces", "list"],
      icon: <List className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Liste numerotee",
      description: "Liste ordonnee",
      searchTerms: ["ordered", "number", "numerotee", "list"],
      icon: <ListOrdered className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Citation",
      description: "Bloc de citation",
      searchTerms: ["quote", "citation", "blockquote"],
      icon: <Quote className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Separateur",
      description: "Ligne horizontale",
      searchTerms: ["hr", "divider", "separator", "separateur"],
      icon: <Minus className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Image",
      description: "Inserer une image",
      searchTerms: ["photo", "picture", "image", "media"],
      icon: <ImagePlus className="size-[18px]" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onImageUpload();
      },
    },
  ]);
}

// ─── Bubble menu (inline formatting) ────────────────────────

function BubbleMenuContent() {
  return (
    <EditorBubble
      tippyOptions={{ placement: "top" }}
      className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-xl"
    >
      <EditorBubbleItem
        onSelect={(editor) => editor.chain().focus().toggleBold().run()}
      >
        <BubbleBtn
          icon={Bold}
          isActive={(e) => e.isActive("bold")}
          title="Gras"
        />
      </EditorBubbleItem>

      <EditorBubbleItem
        onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
      >
        <BubbleBtn
          icon={Italic}
          isActive={(e) => e.isActive("italic")}
          title="Italique"
        />
      </EditorBubbleItem>

      <EditorBubbleItem
        onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
      >
        <BubbleBtn
          icon={UnderlineIcon}
          isActive={(e) => e.isActive("underline")}
          title="Souligne"
        />
      </EditorBubbleItem>

      <EditorBubbleItem
        onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
      >
        <BubbleBtn
          icon={Strikethrough}
          isActive={(e) => e.isActive("strike")}
          title="Barre"
        />
      </EditorBubbleItem>

      <BubbleSep />

      <EditorBubbleItem
        onSelect={(editor) => editor.chain().focus().toggleHighlight().run()}
      >
        <BubbleBtn
          icon={Highlighter}
          isActive={(e) => e.isActive("highlight")}
          title="Surligner"
        />
      </EditorBubbleItem>

      <EditorBubbleItem
        onSelect={(editor) => editor.chain().focus().toggleCode().run()}
      >
        <BubbleBtn
          icon={Code}
          isActive={(e) => e.isActive("code")}
          title="Code"
        />
      </EditorBubbleItem>

      <BubbleSep />

      <EditorBubbleItem
        onSelect={(editor) => {
          const previousUrl = editor.getAttributes("link").href as
            | string
            | undefined;
          const url = window.prompt("URL du lien :", previousUrl ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        <BubbleBtn
          icon={Link}
          isActive={(e) => e.isActive("link")}
          title="Lien"
        />
      </EditorBubbleItem>

      <BubbleSep />

      <EditorBubbleItem
        onSelect={(editor) => editor.chain().focus().setTextAlign("left").run()}
      >
        <BubbleBtn
          icon={AlignLeft}
          isActive={(e) => e.isActive({ textAlign: "left" })}
          title="Gauche"
        />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={(editor) =>
          editor.chain().focus().setTextAlign("center").run()
        }
      >
        <BubbleBtn
          icon={AlignCenter}
          isActive={(e) => e.isActive({ textAlign: "center" })}
          title="Centre"
        />
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={(editor) =>
          editor.chain().focus().setTextAlign("right").run()
        }
      >
        <BubbleBtn
          icon={AlignRight}
          isActive={(e) => e.isActive({ textAlign: "right" })}
          title="Droite"
        />
      </EditorBubbleItem>
    </EditorBubble>
  );
}

function BubbleBtn({
  icon: Icon,
  isActive,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  isActive: (editor: EditorInstance) => boolean;
  title: string;
}) {
  // BubbleBtnInner needs editor context — we get it from the parent EditorBubbleItem
  return <BubbleBtnInner icon={Icon} isActive={isActive} title={title} />;
}

function BubbleBtnInner({
  icon: Icon,
  isActive: _isActive,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  isActive: (editor: EditorInstance) => boolean;
  title: string;
}) {
  // This is rendered inside EditorBubbleItem which provides the editor via useEditor
  // We use a simple hook-free approach since the active state is determined at render
  // The parent EditorBubbleItem handles the click via onSelect
  return (
    <button
      type="button"
      className={cn(
        "p-1.5 rounded hover:bg-muted transition-colors",
        // Note: active state is determined by parent context
      )}
      title={title}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function BubbleSep() {
  return <div className="w-px h-4 bg-border mx-0.5 shrink-0" />;
}

// ─── Helpers ────────────────────────────────────────────────

function parseInitialContent(value: string): JSONContent | undefined {
  if (!value) return undefined;
  // Try to parse as JSON first (new format)
  try {
    const parsed = JSON.parse(value) as JSONContent;
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
  } catch {
    // Not JSON — assume legacy HTML
  }
  // For legacy HTML content, return undefined and let the editor handle it
  // via the html extension or manual conversion
  return undefined;
}

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

// ─── Main Editor Component ──────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder: _placeholder,
  className,
}: RichTextEditorProps) {
  const { onUpload, uploadedImages } = useConvexImageUpload();
  const deleteFile = useMutation(api.files.mutations.deleteFile);
  const deleteFileRef = useRef(deleteFile);
  deleteFileRef.current = deleteFile;

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [_uploading, setUploading] = useState(false);
  const initializedRef = useRef(false);
  const editorRef = useRef<EditorInstance | null>(null);

  // Parse initial content
  const initialContent = parseInitialContent(value);

  // Stable slash items — imageInputRef is a stable ref, so no deps needed
  const slashItems = useMemo(
    () => createSlashItems(() => imageInputRef.current?.click()),
    [],
  );

  // Extensions — created once, Command configured with items + render
  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-outside leading-3 -mt-2",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-outside leading-3 -mt-2",
          },
        },
        listItem: {
          HTMLAttributes: { class: "leading-normal -mb-2" },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-primary",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              "rounded-md bg-muted text-muted-foreground border p-5 font-mono font-medium",
          },
        },
        code: {
          HTMLAttributes: {
            class: "rounded-md bg-muted px-1.5 py-1 font-mono font-medium",
          },
        },
        dropcursor: { color: "oklch(0.75 0.18 70)", width: 4 },
      }),
      TiptapLink.configure({
        autolink: true,
        defaultProtocol: "https",
        linkOnPaste: true,
        HTMLAttributes: {
          class:
            "text-primary underline underline-offset-[3px] hover:text-primary/80 transition-colors cursor-pointer",
        },
      }),
      UpdatedImage.configure({
        HTMLAttributes: { class: "rounded-lg border border-muted" },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Titre ${node.attrs.level as number}`;
          }
          return "Tapez '/' pour les commandes...";
        },
        includeChildren: true,
      }),
      HighlightExtension.configure({ multicolor: true }),
      TiptapUnderline,
      TextStyle,
      Color,
      Command.configure({
        suggestion: {
          items: () => slashItems,
          render: () => renderItems(),
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    [slashItems],
  );

  // Image upload handler for Novel's createImageUpload
  const uploadFn = createImageUpload({
    validateFn: (file) => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Le fichier doit etre une image");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("L'image ne doit pas depasser 5 Mo");
      }
    },
    onUpload: async (file) => {
      setUploading(true);
      try {
        const url = await onUpload(file);
        return url;
      } finally {
        setUploading(false);
      }
    },
  });

  // Handle manual image input (from slash command "Image")
  const handleImageInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;
      setUploading(true);
      try {
        const url = await onUpload(file);
        editorRef.current
          .chain()
          .focus()
          .setImage({ src: url, alt: file.name })
          .run();
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [onUpload],
  );

  // Sync legacy HTML content into editor once
  useEffect(() => {
    if (!editorRef.current || initializedRef.current) return;
    if (value && !initialContent) {
      // Legacy HTML content — set it into the editor
      editorRef.current.commands.setContent(value, false);
      initializedRef.current = true;
    }
  }, [value, initialContent]);

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={editorExtensions}
          className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-li:text-muted-foreground prose-mark:bg-yellow-200 prose-mark:text-yellow-900 dark:prose-mark:bg-yellow-800 dark:prose-mark:text-yellow-100 prose-code:bg-muted prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-hr:border-border prose-blockquote:text-muted-foreground"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) =>
                handleCommandNavigation(event as unknown as KeyboardEvent),
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "p-4 focus:outline-none overflow-y-auto min-h-[200px] max-h-[500px]",
            },
          }}
          onUpdate={({ editor }) => {
            editorRef.current = editor;
            // Emit JSON stringified content
            onChange(JSON.stringify(editor.getJSON()));
            // Clean up removed images from Convex storage
            const currentSrcs = new Set<string>();
            extractImageSrcs(editor.getJSON(), currentSrcs);
            for (const [storageId, src] of uploadedImages.current.entries()) {
              if (!currentSrcs.has(src)) {
                uploadedImages.current.delete(storageId);
                deleteFileRef
                  .current({ storageId: storageId as Id<"_storage"> })
                  .catch(() => {});
              }
            }
          }}
          onCreate={({ editor }) => {
            editorRef.current = editor;
          }}
        >
          {/* Bubble menu (doit rester à l'intérieur de EditorContent) */}
          <BubbleMenuContent />
        </EditorContent>

        {/* Slash commands et ImageResizer doivent être frères de EditorContent */}
        <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty className="px-2 text-muted-foreground text-sm">
            Aucun resultat
          </EditorCommandEmpty>
          <EditorCommandList>
            {slashItems.map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                key={item.title}
                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent aria-selected:bg-accent cursor-pointer"
              >
                <div className="flex items-center justify-center size-8 rounded-md border bg-background">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>

        <ImageResizer />
      </EditorRoot>

      {/* Hidden file input for manual image upload via slash command */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleImageInput}
      />
    </div>
  );
}
