// filepath: src/components/products/molecules/ProductRowActions.tsx

"use client";

import {
  Copy,
  Edit,
  Archive,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  CheckCircle,
  FileX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ProductStatus = "draft" | "active" | "archived" | "out_of_stock";

interface ProductRowActionsProps {
  productId: string;
  productSlug: string;
  status: ProductStatus;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStatusChange: (id: string, status: "draft" | "active" | "archived") => void;
  onDelete: (id: string) => void;
}

export function ProductRowActions({
  productId,
  productSlug,
  status,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
}: ProductRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(productId)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(productId)}>
          <Copy className="mr-2 h-4 w-4" />
          Dupliquer
        </DropdownMenuItem>
        {status === "active" && (
          <DropdownMenuItem asChild>
            <a href={`/products/${productSlug}`} target="_blank" rel="noopener">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir la page
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Status transitions */}
        {(status === "draft" || status === "out_of_stock") && (
          <DropdownMenuItem onClick={() => onStatusChange(productId, "active")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Publier
          </DropdownMenuItem>
        )}
        {status === "active" && (
          <DropdownMenuItem onClick={() => onStatusChange(productId, "draft")}>
            <FileX className="mr-2 h-4 w-4" />
            Dépublier
          </DropdownMenuItem>
        )}
        {(status === "active" || status === "draft") && (
          <DropdownMenuItem
            onClick={() => onStatusChange(productId, "archived")}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archiver
          </DropdownMenuItem>
        )}
        {status === "archived" && (
          <DropdownMenuItem onClick={() => onStatusChange(productId, "draft")}>
            <FileX className="mr-2 h-4 w-4" />
            Restaurer (brouillon)
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onDelete(productId)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
