// filepath: src/components/questions/VendorQAManager.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircleQuestion,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Store,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface VendorQAManagerProps {
  productId: Id<"products">;
}

// ─── Add Q&A Form ─────────────────────────────────────────────────────────────

function AddQAForm({ productId }: { productId: Id<"products"> }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addVendorQA = useMutation(api.questions.mutations.addVendorQA);

  async function handleSubmit() {
    if (!body.trim() || !answer.trim()) return;
    setIsSubmitting(true);
    try {
      await addVendorQA({
        product_id: productId,
        body: body.trim(),
        vendor_answer: answer.trim(),
      });
      toast.success("Q&R ajoutée.");
      setBody("");
      setAnswer("");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'ajout",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Ajouter une Q&R
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
      <p className="text-sm font-semibold">Nouvelle question / réponse</p>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Question
        </label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ex : Ce produit est-il lavable en machine ?"
          rows={2}
          maxLength={500}
          className="resize-none"
          autoFocus
        />
        <span className="text-xs text-muted-foreground">{body.length}/500</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Réponse
        </label>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Ex : Oui, lavable à 30°C en machine."
          rows={3}
          maxLength={1000}
          className="resize-none"
        />
        <span className="text-xs text-muted-foreground">
          {answer.length}/1000
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setBody("");
            setAnswer("");
          }}
        >
          Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!body.trim() || !answer.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Ajout…" : "Ajouter"}
        </Button>
      </div>
    </div>
  );
}

// ─── Inline Answer Form ───────────────────────────────────────────────────────

function AnswerForm({
  questionId,
  existing,
  onDone,
}: {
  questionId: Id<"product_questions">;
  existing?: string;
  onDone: () => void;
}) {
  const [value, setValue] = useState(existing ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const answerMutation = useMutation(
    existing
      ? api.questions.mutations.editAnswer
      : api.questions.mutations.answer,
  );

  async function handleSubmit() {
    if (!value.trim()) return;
    setIsSubmitting(true);
    try {
      await answerMutation({
        question_id: questionId,
        vendor_answer: value.trim(),
      });
      toast.success(existing ? "Réponse mise à jour." : "Réponse publiée.");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Votre réponse…"
        rows={3}
        maxLength={1000}
        className="resize-none text-sm"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.length}/1000
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X className="size-3.5 mr-1" />
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!value.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            <Check className="size-3.5 mr-1" />
            {isSubmitting ? "…" : existing ? "Mettre à jour" : "Répondre"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

interface QuestionRowProps {
  item: {
    _id: string;
    _creationTime: number;
    body: string;
    source: "customer" | "vendor";
    author_name: string;
    author_avatar?: string;
    vendor_answer?: string;
    answered_at?: number;
    is_published: boolean;
  };
}

function QuestionRow({ item }: QuestionRowProps) {
  const [editingAnswer, setEditingAnswer] = useState(false);
  const removeQuestion = useMutation(api.questions.mutations.remove);
  const setPublished = useMutation(api.questions.mutations.setPublished);

  const timeAgo = formatDistanceToNow(new Date(item._creationTime), {
    addSuffix: true,
    locale: fr,
  });

  async function handleDelete() {
    try {
      await removeQuestion({
        question_id: item._id as Id<"product_questions">,
      });
      toast.success("Question supprimée.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  }

  async function handleTogglePublish() {
    try {
      await setPublished({
        question_id: item._id as Id<"product_questions">,
        is_published: !item.is_published,
      });
      toast.success(
        item.is_published ? "Question masquée." : "Question publiée.",
      );
    } catch {
      toast.error("Erreur.");
    }
  }

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        !item.is_published ? "opacity-60 bg-muted/30" : "bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar className="size-7 shrink-0 mt-0.5">
            <AvatarImage src={item.author_avatar} />
            <AvatarFallback className="text-xs">
              {item.author_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium">{item.author_name}</span>
              {item.source === "vendor" ? (
                <Badge variant="secondary" className="text-xs gap-1 py-0">
                  <Store className="size-3" />
                  Vendeur
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs py-0">
                  Client
                </Badge>
              )}
              {!item.is_published && (
                <Badge variant="destructive" className="text-xs py-0">
                  Masquée
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <p className="text-sm leading-relaxed">{item.body}</p>
          </div>
        </div>

        {/* Row actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title={item.is_published ? "Masquer" : "Publier"}
            onClick={handleTogglePublish}
          >
            {item.is_published ? (
              <EyeOff className="size-3.5 text-muted-foreground" />
            ) : (
              <Eye className="size-3.5 text-muted-foreground" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            title="Supprimer"
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Answer area */}
      {editingAnswer ? (
        <div className="pl-10">
          <AnswerForm
            questionId={item._id as Id<"product_questions">}
            existing={item.vendor_answer}
            onDone={() => setEditingAnswer(false)}
          />
        </div>
      ) : item.vendor_answer ? (
        <div className="pl-10 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="border-l-2 border-primary/40 pl-3 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Store className="size-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-primary">
                    Votre réponse
                  </span>
                  {item.answered_at && (
                    <span className="text-xs text-muted-foreground">
                      ·{" "}
                      {formatDistanceToNow(new Date(item.answered_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {item.vendor_answer}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              title="Modifier la réponse"
              onClick={() => setEditingAnswer(true)}
            >
              <Pencil className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="pl-10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground h-8"
            onClick={() => setEditingAnswer(true)}
          >
            <MessageCircleQuestion className="size-4" />
            Répondre à cette question
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VendorQAManager({ productId }: VendorQAManagerProps) {
  const questions = useQuery(api.questions.queries.listByProductForVendor, {
    product_id: productId,
  });

  if (questions === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const unanswered = questions.filter((q) => !q.vendor_answer);
  const answered = questions.filter((q) => q.vendor_answer);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold">Questions & Réponses</h3>
          <p className="text-sm text-muted-foreground">
            {questions.length === 0
              ? "Aucune question pour ce produit."
              : `${questions.length} question${questions.length > 1 ? "s" : ""} — ${unanswered.length} sans réponse`}
          </p>
        </div>
        <AddQAForm productId={productId} />
      </div>

      {/* Unanswered first */}
      {unanswered.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
            En attente de réponse ({unanswered.length})
          </p>
          {unanswered.map((item) => (
            <QuestionRow key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Answered */}
      {answered.length > 0 && (
        <div className="space-y-3">
          {unanswered.length > 0 && <Separator />}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Répondues ({answered.length})
          </p>
          {answered.map((item) => (
            <QuestionRow key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Empty */}
      {questions.length === 0 && (
        <div className="py-10 text-center text-muted-foreground border rounded-lg">
          <MessageCircleQuestion className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Pas encore de questions. Ajoutez des Q&R pour anticiper les
            questions fréquentes de vos clients.
          </p>
        </div>
      )}
    </div>
  );
}
