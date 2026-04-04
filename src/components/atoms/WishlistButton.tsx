// filepath: src/components/atoms/WishlistButton.tsx

"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import { ROUTES } from "@/constants/routes";
import type { Id } from "../../../convex/_generated/dataModel";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const router = useRouter();
  const wishlisted = useQuery(api.wishlists.queries.listByUser);
  const toggle = useMutation(api.wishlists.mutations.toggle);

  const isWishlisted = wishlisted?.includes(productId) ?? false;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Redirect unauthenticated users to login
    if (wishlisted === null) {
      router.push(ROUTES.LOGIN);
      return;
    }

    try {
      const result = await toggle({
        productId: productId as Id<"products">,
      });
      if (result.wishlisted) {
        toast.success("Ajouté à votre liste de souhaits");
      } else {
        toast.info("Retiré de votre liste de souhaits");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isWishlisted}
      className={cn(
        "flex items-center justify-center size-8 rounded-full transition-colors",
        "bg-white/80 hover:bg-white shadow-sm",
        isWishlisted
          ? "text-red-500"
          : "text-muted-foreground hover:text-red-500",
        className,
      )}
    >
      <Heart
        className={cn("size-4", isWishlisted && "fill-current")}
        aria-hidden
      />
    </button>
  );
}
