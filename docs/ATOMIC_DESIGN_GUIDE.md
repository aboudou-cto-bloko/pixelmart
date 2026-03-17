# ATOMIC DESIGN GUIDE — Pixel-Mart

> Guide de construction des composants UI.
> shadcn/ui + Tailwind CSS + Atomic Design methodology.

---

## 1. Philosophie

Les interfaces de Pixel-Mart sont construites selon l'Atomic Design de Brad Frost :
des éléments simples assemblés progressivement en systèmes complexes.

```
Atoms → Molecules → Organisms → Templates → Pages
```

Chaque niveau a des règles claires sur ce qu'il peut contenir et ce qu'il ne peut pas.

---

## 2. Hiérarchie des composants

### Atoms — Éléments de base non divisibles

Composants UI sans état propre, sans logique métier, sans appels Convex.

```
src/components/[domain]/atoms/
  PriceTag.tsx       ← affiche un prix formaté
  StockBadge.tsx     ← badge "En stock" / "Rupture"
  StatusPill.tsx     ← pill de statut coloré
  ProductImage.tsx   ← image avec fallback
  StarRating.tsx     ← étoiles (lecture seule)
  CurrencyAmount.tsx ← montant en XOF formaté
```

**Règles atoms :**
- Pas de `useQuery` / `useMutation`
- Pas de logique métier
- Props simples, typées précisément
- Composant shadcn/ui utilisé directement ou wrappé minimalement

```typescript
// ✅ Atom correct
interface PriceTagProps {
  amountInCentimes: number;
  currency?: string;
  className?: string;
}

export function PriceTag({
  amountInCentimes,
  currency = "XOF",
  className,
}: PriceTagProps) {
  return (
    <span className={cn("font-semibold tabular-nums", className)}>
      {formatPrice(amountInCentimes, currency)}
    </span>
  );
}
```

### Molecules — Combinaisons d'atoms avec une mini-logique UI

```
src/components/[domain]/molecules/
  ProductCard.tsx        ← image + nom + prix + badge stock
  OrderStatusTimeline.tsx ← liste de StatusPill avec dates
  VendorRatingRow.tsx    ← StarRating + nombre d'avis
  PayoutHistoryItem.tsx  ← montant + statut + date
```

**Règles molecules :**
- Combine 2-5 atoms ou composants shadcn
- Peut avoir un état UI local (hover, open/close)
- Pas d'appels Convex directs — données passées en props
- Réutilisable dans plusieurs contextes

```typescript
// ✅ Molecule correcte
interface ProductCardProps {
  name: string;
  priceInCentimes: number;
  imageUrl?: string;
  stock: number;
  slug: string;
}

export function ProductCard({
  name,
  priceInCentimes,
  imageUrl,
  stock,
  slug,
}: ProductCardProps) {
  return (
    <Link href={`/products/${slug}`}>
      <Card className="group cursor-pointer hover:shadow-md transition-shadow">
        <ProductImage alt={name} className="aspect-square" src={imageUrl} />
        <CardContent className="p-3">
          <p className="font-medium line-clamp-2">{name}</p>
          <div className="mt-1 flex items-center justify-between">
            <PriceTag amountInCentimes={priceInCentimes} />
            <StockBadge stock={stock} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Organisms — Sections complètes avec données réelles

```
src/components/[domain]/organisms/
  ProductGrid.tsx         ← grille paginée de ProductCard
  ProductForm.tsx         ← formulaire création/édition produit
  OrderList.tsx           ← liste d'ordres avec filtres
  VendorSalesChart.tsx    ← graphique CA avec données Convex
  AdSlotWrapper.tsx       ← wrapper tracking pour les emplacements publicitaires
```

**Règles organisms :**
- Peut utiliser `useQuery`, `useMutation`, `usePaginatedQuery`
- Gère son propre état de chargement et d'erreur
- Représente une section fonctionnelle complète
- "use client" si nécessaire

```typescript
// ✅ Organism correct
"use client";

export function ProductGrid({ storeId }: { storeId: Id<"stores"> }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.products.queries.getProductsByStore,
    { storeId },
    { initialNumItems: 20 }
  );

  if (status === "LoadingFirstPage") {
    return <ProductGridSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((product) => (
          <ProductCard
            key={product._id}
            imageUrl={product.images[0]}
            name={product.name}
            priceInCentimes={product.priceInCentimes}
            slug={product.slug}
            stock={product.stock}
          />
        ))}
      </div>

      {status === "CanLoadMore" && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => loadMore(20)}
        >
          Voir plus
        </Button>
      )}
    </div>
  );
}
```

### Templates — Layouts de page sans données spécifiques

```
src/components/[domain]/templates/
  ProductListTemplate.tsx   ← layout : header + filtres + grille
  OrderDetailTemplate.tsx   ← layout : info commande + timeline + actions
  VendorDashboardTemplate.tsx ← layout : KPIs + graphiques + actions rapides
```

**Règles templates :**
- Définit la structure visuelle de la page
- Reçoit les données et organisms en props ou enfants
- Pas d'appels Convex
- Responsable du responsive layout

```typescript
// ✅ Template correct
interface ProductListTemplateProps {
  storeId: Id<"stores">;
  header: React.ReactNode;
  filters: React.ReactNode;
}

export function ProductListTemplate({
  storeId,
  header,
  filters,
}: ProductListTemplateProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">{header}</div>
      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">{filters}</aside>
        <main className="min-w-0 flex-1">
          <ProductGrid storeId={storeId} />
        </main>
      </div>
    </div>
  );
}
```

### Pages — Orchestration finale (Next.js)

```
src/app/(vendor)/vendor/products/page.tsx
```

**Règles pages :**
- Server Component par défaut
- Récupère les params, searchParams, session
- Orchestre template + organisms
- Délègue tout le rendu aux niveaux inférieurs

```typescript
// ✅ Page correcte — Server Component
export default async function VendorProductsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const store = await fetchCurrentVendorStore(session.userId);

  return (
    <ProductListTemplate
      storeId={store._id}
      filters={<ProductFiltersOrganism />}
      header={
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mes produits</h1>
          <AddProductButton />
        </div>
      }
    />
  );
}
```

---

## 3. shadcn/ui — règles d'utilisation

### Toujours installer via CLI

```bash
# ✅ Installation CLI — maintient la cohérence
npx shadcn@latest add button
npx shadcn@latest add card dialog form input select

# ❌ Jamais copier-coller depuis la doc sans passer par CLI
```

### Composants disponibles — les utiliser avant de créer

Vérifier que shadcn ne propose pas déjà ce dont tu as besoin :

```
Formulaires : Form, Input, Textarea, Select, Checkbox, RadioGroup, Switch
Layout : Card, Separator, Sheet, Dialog, Drawer
Navigation : Tabs, Breadcrumb, Pagination
Feedback : Alert, Toast (Sonner), Badge, Progress, Skeleton
Data : Table, DataTable (avec TanStack)
Overlay : Dialog, AlertDialog, Popover, Tooltip, DropdownMenu
```

**Si shadcn le propose → utiliser shadcn. Jamais recréer.**

### Extension des composants — wrapping, pas override

```typescript
// ❌ Override du fichier shadcn directement
// src/components/ui/button.tsx — NE PAS MODIFIER les composants shadcn

// ✅ Wrapper avec extensions
// src/components/atoms/LoadingButton.tsx
interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
}

export function LoadingButton({ isLoading, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

### Formulaires — react-hook-form + zod + shadcn Form

```typescript
// ✅ Pattern standard pour tous les formulaires
const productSchema = z.object({
  name: z.string().min(3, "Nom trop court").max(100),
  priceInCentimes: z.number().min(1, "Prix obligatoire"),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductFormOrganism() {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", priceInCentimes: 0 },
  });

  async function onSubmit(values: ProductFormValues) {
    await createProduct(values);
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du produit</FormLabel>
              <FormControl>
                <Input placeholder="iPhone 15 Pro Max" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton isLoading={form.formState.isSubmitting} type="submit">
          Créer le produit
        </LoadingButton>
      </form>
    </Form>
  );
}
```

---

## 4. États de chargement — obligatoires partout

### Skeleton pour chaque organism

```typescript
// ✅ Skeleton correspondant à l'organism
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

### Suspense + loading.tsx pour les pages

```
src/app/(vendor)/vendor/products/
  page.tsx      ← contenu
  loading.tsx   ← skeleton (Suspense boundary automatique Next.js)
  error.tsx     ← error boundary
```

### Toast pour les feedbacks d'actions

```typescript
import { toast } from "sonner";

// ✅ Feedback systématique sur les mutations
async function handleCreateProduct(values: ProductFormValues) {
  try {
    await createProduct(values);
    toast.success("Produit créé avec succès");
    router.push("/vendor/products");
  } catch (error) {
    toast.error("Erreur lors de la création du produit");
  }
}
```

---

## 5. Responsive — mobile-first toujours

### Breakpoints Pixel-Mart

| Breakpoint | Tailwind | Usage |
|-----------|----------|-------|
| Mobile | `default` | <= 639px — layout 1 colonne |
| Tablette | `sm:` `md:` | 640-1023px — 2 colonnes |
| Desktop | `lg:` `xl:` | >= 1024px — 3-4 colonnes |

### Patterns courants

```typescript
// Grille responsive
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Sidebar cachée sur mobile
<aside className="hidden lg:block w-64">

// Navigation mobile → Sheet
<Sheet>
  <SheetTrigger asChild>
    <Button className="lg:hidden" size="icon" variant="ghost">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <MobileNav />
  </SheetContent>
</Sheet>

// Texte responsive
<h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">

// Padding responsive
<div className="px-4 py-4 sm:px-6 lg:px-8">
```

---

## 6. Checklist composant

Avant de merger un composant :

```
✅ Placement correct dans la hiérarchie (atom/molecule/organism/template)
✅ Props typées précisément (pas de any, pas de Record<string, unknown> générique)
✅ État de chargement géré (skeleton ou spinner)
✅ État d'erreur géré (message explicite ou ConvexError catchée)
✅ Responsive : testé à 375px, 768px, 1280px
✅ shadcn utilisé si disponible (pas de réimplémentation)
✅ "use client" uniquement si nécessaire
✅ Aucune logique métier dans les atoms et molecules
✅ Aucun appel Convex dans les atoms, molecules et templates
```

---

*Voir aussi : `CONTRIBUTING.md` (workflow git), `CODE_STYLE_GUIDE.md` (TypeScript), `CONVEX_PATTERNS.md` (backend)*
