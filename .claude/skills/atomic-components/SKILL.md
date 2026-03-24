---
name: atomic-components
description: |
  Use when creating React components for Pixel-Mart. Triggers on: creating components, UI work, 
  working in src/components/, building pages, forms, or any frontend UI. Enforces Atomic Design 
  methodology with shadcn/ui base components.
allowed-tools: [Read, Write, Grep, Glob, Bash]
---

# Atomic Design Components for Pixel-Mart

## Component Hierarchy

```
src/components/
├── ui/              # shadcn/ui base (DO NOT MODIFY)
├── atoms/           # Basic building blocks
├── molecules/       # Combined atoms
├── organisms/       # Feature-complete sections
└── templates/       # Page layouts
```

## Classification Rules

### Atoms (No Business Logic)
- Single HTML element wrappers
- No state management
- No data fetching
- Examples: `StarRating`, `CurrencyDisplay`, `StatusBadge`, `Avatar`

```typescript
// atoms/CurrencyDisplay.tsx
interface CurrencyDisplayProps {
  amount: number; // centimes
  currency?: string;
}

export function CurrencyDisplay({ amount, currency = "XOF" }: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);

  return <span className="font-medium tabular-nums">{formatted}</span>;
}
```

### Molecules (Combined Atoms)
- Combine 2-4 atoms
- May have minimal local state
- No direct data fetching
- Examples: `SearchBar`, `CartItem`, `ProductCard`, `ReviewCard`

```typescript
// molecules/ProductCard.tsx
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/atoms/CurrencyDisplay";
import { StarRating } from "@/components/atoms/StarRating";

interface ProductCardProps {
  product: {
    name: string;
    price: number;
    imageUrl: string;
    rating: number;
    reviewCount: number;
    inStock: boolean;
  };
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="object-cover w-full h-full"
        />
        {!product.inStock && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Rupture
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <StarRating value={product.rating} size="sm" />
          <span className="text-sm text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <CurrencyDisplay amount={product.price} />
      </CardFooter>
    </Card>
  );
}
```

### Organisms (Feature-Complete Sections)
- Self-contained features
- Can fetch data
- Can have complex state
- Examples: `ProductGrid`, `OrderTimeline`, `CheckoutForm`, `VendorSidebar`

```typescript
// organisms/ProductGrid.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ProductCard } from "@/components/molecules/ProductCard";
import { ProductGridSkeleton } from "@/components/atoms/skeletons/ProductGridSkeleton";
import { EmptyState } from "@/components/atoms/EmptyState";

interface ProductGridProps {
  categoryId?: string;
  searchQuery?: string;
}

export function ProductGrid({ categoryId, searchQuery }: ProductGridProps) {
  const products = useQuery(api.products.queries.listProducts, {
    categoryId,
    searchQuery,
  });

  if (products === undefined) {
    return <ProductGridSkeleton />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="Aucun produit trouvé"
        description="Essayez d'autres filtres"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
```

### Templates (Page Layouts)
- Define page structure
- Use slots for content
- Handle layout responsiveness
- Examples: `DashboardTemplate`, `StorefrontTemplate`, `AuthTemplate`

```typescript
// templates/DashboardTemplate.tsx
import { VendorSidebar } from "@/components/organisms/VendorSidebar";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";

interface DashboardTemplateProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export function DashboardTemplate({ 
  children, 
  title, 
  actions 
}: DashboardTemplateProps) {
  return (
    <div className="flex min-h-screen">
      <VendorSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader title={title} actions={actions} />
        <main className="flex-1 p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## shadcn/ui Usage

### Adding Components

```bash
# Always use the CLI
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card dialog form input
```

### Never Modify `/ui` Directly

```typescript
// ❌ WRONG - Modifying shadcn component
// src/components/ui/button.tsx - DO NOT EDIT

// ✅ CORRECT - Extend with wrapper
// src/components/atoms/IconButton.tsx
import { Button, ButtonProps } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface IconButtonProps extends ButtonProps {
  icon: LucideIcon;
  label: string;
}

export function IconButton({ icon: Icon, label, ...props }: IconButtonProps) {
  return (
    <Button size="icon" aria-label={label} {...props}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
```

## File Naming Convention

```
ComponentName.tsx         # Main component
ComponentName.test.tsx    # Tests (Vitest)
ComponentName.stories.tsx # Storybook (if used)
index.ts                  # Re-exports
```

## Client vs Server Components

```typescript
// DEFAULT: Server Component (no directive needed)
export function StaticContent() {
  return <div>Static</div>;
}

// CLIENT: Only when needed
"use client";

import { useState } from "react";

export function InteractiveContent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Use "use client" ONLY for:**
- Hooks (useState, useEffect, custom hooks)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Convex reactive queries (useQuery, useMutation)

## Form Pattern (react-hook-form + Zod)

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const productSchema = z.object({
  name: z.string().min(3, "Nom trop court"),
  price: z.coerce.number().min(100, "Prix minimum: 1 XOF"),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm() {
  const createProduct = useMutation(api.products.mutations.createProduct);
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: 0 },
  });

  const onSubmit = async (data: ProductFormData) => {
    await createProduct(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du produit</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Créer
        </Button>
      </form>
    </Form>
  );
}
```

## Loading & Error States

Every organism needs:

```typescript
// Loading skeleton
if (data === undefined) {
  return <ComponentSkeleton />;
}

// Error state
if (error) {
  return <ErrorState message={error.message} onRetry={refetch} />;
}

// Empty state
if (data.length === 0) {
  return <EmptyState icon="..." title="..." />;
}
```
