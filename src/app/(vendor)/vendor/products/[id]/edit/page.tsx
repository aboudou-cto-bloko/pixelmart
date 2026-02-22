"use client";

import { use } from "react";
import { ProductForm } from "@/components/products/ProductForm";
import type { Id } from "@/types";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Modifier le produit
        </h1>
      </div>
      <ProductForm mode="edit" productId={id as Id<"products">} />
    </div>
  );
}
