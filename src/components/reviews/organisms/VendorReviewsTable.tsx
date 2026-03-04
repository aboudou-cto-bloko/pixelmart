// filepath: src/components/reviews/organisms/VendorReviewsTable.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StarRating, ReviewStatusBadge } from "../atoms";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, MessageSquare } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export function VendorReviewsTable() {
  const store = useQuery(api.stores.queries.getMyStore);
  const reviews = useQuery(
    api.reviews.queries.listByStore,
    store ? { store_id: store._id } : "skip",
  );
  const replyMutation = useMutation(api.reviews.mutations.reply);

  const [replyDialog, setReplyDialog] = useState<{
    open: boolean;
    reviewId: Id<"reviews"> | null;
    customerName: string;
  }>({ open: false, reviewId: null, customerName: "" });
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  async function handleReply() {
    if (!replyDialog.reviewId || !replyText.trim()) return;

    setIsReplying(true);
    try {
      await replyMutation({
        review_id: replyDialog.reviewId,
        vendor_reply: replyText.trim(),
      });
      toast.success("Réponse envoyée");
      setReplyDialog({ open: false, reviewId: null, customerName: "" });
      setReplyText("");
    } catch {
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setIsReplying(false);
    }
  }

  if (!reviews) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun avis reçu pour le moment</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produit</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Avis</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review._id}>
              <TableCell className="max-w-[150px] truncate font-medium">
                {review.product_title}
              </TableCell>
              <TableCell className="text-sm">{review.customer_name}</TableCell>
              <TableCell>
                <StarRating rating={review.rating} size="sm" />
              </TableCell>
              <TableCell className="max-w-[200px]">
                {review.title && (
                  <p className="font-medium text-sm truncate">{review.title}</p>
                )}
                {review.body && (
                  <p className="text-xs text-muted-foreground truncate">
                    {review.body}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <ReviewStatusBadge
                  isPublished={review.is_published}
                  flagged={review.flagged}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review._creationTime), {
                  addSuffix: true,
                  locale: fr,
                })}
              </TableCell>
              <TableCell className="text-right">
                {review.vendor_reply ? (
                  <Badge variant="outline" className="gap-1">
                    <MessageSquare className="size-3" />
                    Répondu
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyDialog({
                        open: true,
                        reviewId: review._id as Id<"reviews">,
                        customerName: review.customer_name,
                      });
                      setReplyText("");
                    }}
                  >
                    Répondre
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Reply dialog */}
      <Dialog
        open={replyDialog.open}
        onOpenChange={(open) =>
          !open &&
          setReplyDialog({ open: false, reviewId: null, customerName: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à {replyDialog.customerName}</DialogTitle>
            <DialogDescription>
              Votre réponse sera visible publiquement sous l&apos;avis du
              client.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Merci pour votre retour..."
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {replyText.length}/1000
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setReplyDialog({
                  open: false,
                  reviewId: null,
                  customerName: "",
                })
              }
            >
              Annuler
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || isReplying}
            >
              {isReplying && <Loader2 className="mr-2 size-4 animate-spin" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
