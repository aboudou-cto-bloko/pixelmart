import { ProductForm } from "@/components/products/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nouveau produit
        </h1>
        <p className="text-sm text-muted-foreground">
          Remplissez les informations et enregistrez en brouillon. Vous pourrez
          publier ensuite.
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
