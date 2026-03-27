// filepath: src/components/questions/ProductQASection.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircleQuestion,
  Store,
  ChevronDown,
  ChevronUp,
  Plus,
  Reply,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";

interface ProductQASectionProps {
  productId: Id<"products">;
  /** Pass the store owner's user id to show vendor controls only to the actual owner */
  storeOwnerId?: Id<"users">;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface QAItem {
  _id: string;
  _creationTime: number;
  body: string;
  source: "customer" | "vendor";
  author_name: string;
  author_avatar?: string;
  vendor_answer?: string;
  answered_at?: number;
}

// ─── Vendor Answer Form (inline per question) ─────────────────────────────────

function VendorAnswerForm({
  questionId,
  existingAnswer,
}: {
  questionId: Id<"product_questions">;
  existingAnswer?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(existingAnswer ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answerMutation = useMutation(api.questions.mutations.answer);
  const editMutation = useMutation(api.questions.mutations.editAnswer);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      if (existingAnswer) {
        await editMutation({
          question_id: questionId,
          vendor_answer: text.trim(),
        });
        toast.success("Réponse mise à jour.");
      } else {
        await answerMutation({
          question_id: questionId,
          vendor_answer: text.trim(),
        });
        toast.success("Réponse publiée.");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs h-7 px-2"
        onClick={() => {
          setText(existingAnswer ?? "");
          setOpen(true);
        }}
      >
        <Reply className="size-3.5" />
        {existingAnswer ? "Modifier la réponse" : "Répondre"}
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 space-y-2 rounded-lg border p-3 bg-muted/20"
    >
      <p className="text-xs font-semibold flex items-center gap-1.5">
        <Store className="size-3.5 text-primary" />
        {existingAnswer ? "Modifier votre réponse" : "Votre réponse"}
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Répondez à cette question…"
        rows={3}
        maxLength={1000}
        className="resize-none text-sm"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {text.length}/1000
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting
              ? "Envoi…"
              : existingAnswer
                ? "Mettre à jour"
                : "Publier"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({ item, isVendor }: { item: QAItem; isVendor: boolean }) {
  const timeAgo = formatDistanceToNow(new Date(item._creationTime), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="space-y-3 py-4 border-b last:border-0">
      {/* Question */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm mt-1 leading-relaxed">{item.body}</p>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>

      {/* Vendor answer */}
      {item.vendor_answer ? (
        <div className="ml-4 bg-muted/40 rounded-lg p-3 space-y-1 border-l-2 border-primary/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Store className="size-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Réponse du vendeur
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
            {isVendor && (
              <VendorAnswerForm
                questionId={item._id as Id<"product_questions">}
                existingAnswer={item.vendor_answer}
              />
            )}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {item.vendor_answer}
          </p>
        </div>
      ) : (
        <div className="ml-4 flex items-center gap-3">
          <p className="text-xs text-muted-foreground italic">
            En attente de réponse du vendeur…
          </p>
          {isVendor && (
            <VendorAnswerForm
              questionId={item._id as Id<"product_questions">}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Customer Ask Form ────────────────────────────────────────────────────────

function CustomerAskForm({ productId }: { productId: Id<"products"> }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const askQuestion = useMutation(api.questions.mutations.ask);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      await askQuestion({ product_id: productId, body: body.trim() });
      toast.success("Question envoyée ! Le vendeur vous répondra bientôt.");
      setBody("");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'envoi",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <MessageCircleQuestion className="size-4" />
        Poser une question
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border p-4 bg-muted/20"
    >
      <p className="text-sm font-medium">Votre question</p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ex : Ce produit est-il disponible en rouge ?"
        rows={3}
        maxLength={500}
        className="resize-none"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {body.length}/500 caractères
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setBody("");
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!body.trim() || isSubmitting}
          >
            {isSubmitting ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Vendor Q&A Seed Form ─────────────────────────────────────────────────────

function VendorQAForm({ productId }: { productId: Id<"products"> }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addVendorQA = useMutation(api.questions.mutations.addVendorQA);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !answer.trim()) return;
    setIsSubmitting(true);
    try {
      await addVendorQA({
        product_id: productId,
        body: body.trim(),
        vendor_answer: answer.trim(),
      });
      toast.success("Q&R ajoutée avec succès.");
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border p-4 bg-muted/20"
    >
      <p className="text-sm font-semibold">Nouvelle question/réponse</p>

      <div className="space-y-2">
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

      <div className="space-y-2">
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
          type="submit"
          size="sm"
          disabled={!body.trim() || !answer.trim() || isSubmitting}
        >
          {isSubmitting ? "Ajout…" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 4;

export function ProductQASection({
  productId,
  storeOwnerId,
}: ProductQASectionProps) {
  const { isAuthenticated, user } = useCurrentUser();
  const [showAll, setShowAll] = useState(false);

  const questions = useQuery(api.questions.queries.listByProduct, {
    product_id: productId,
  });

  if (questions === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const isVendor =
    isAuthenticated &&
    user?.role === "vendor" &&
    storeOwnerId !== undefined &&
    user._id === storeOwnerId;

  const visible = showAll ? questions : questions.slice(0, INITIAL_VISIBLE);
  const hasMore = questions.length > INITIAL_VISIBLE;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircleQuestion className="size-5 text-muted-foreground" />
          Questions & Réponses
          {questions.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({questions.length})
            </span>
          )}
        </h2>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isVendor && <VendorQAForm productId={productId} />}
          {isAuthenticated && !isVendor && (
            <CustomerAskForm productId={productId} />
          )}
          {!isAuthenticated && (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/login">
                <MessageCircleQuestion className="size-4" />
                Connectez-vous pour poser une question
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* List */}
      {questions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <MessageCircleQuestion className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Aucune question pour le moment. Soyez le premier à poser une
            question !
          </p>
        </div>
      ) : (
        <div>
          {visible.map((item) => (
            <QuestionCard
              key={item._id}
              item={item as QAItem}
              isVendor={isVendor}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {showAll ? (
                <>
                  <ChevronUp className="size-4" /> Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" /> Voir les{" "}
                  {questions.length - INITIAL_VISIBLE} autres questions
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
