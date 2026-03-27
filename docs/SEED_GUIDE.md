# Guide Seed — Pixel-Mart Dev & Test

> Créer des comptes, boutiques et produits de test en quelques commandes.

---

## Prérequis

- `pnpm dev` doit tourner (Next.js + Convex)
- Avoir accès au **Convex Dashboard** de l'environnement dev
- Les catégories doivent être seedées (voir étape 0)

---

## Étape 0 — Seed des catégories (une seule fois)

```bash
npx convex run categories/seed:seedCategories
```

Si les catégories existent déjà, cette commande retourne une erreur — c'est normal.

---

## Étape 1 — Activer le mode seed

Dans le **Convex Dashboard** → Settings → Environment Variables → ajouter :

| Variable | Valeur |
|---|---|
| `SEED_ENABLED` | `true` |
| `SEED_MODE` | `true` |

> `SEED_MODE=true` désactive temporairement l'obligation de vérifier l'email.
> `SEED_ENABLED=true` autorise l'exécution des fonctions seed.

---

## Étape 2 — Seed complet (tout d'un coup)

```bash
npx convex run seed/index:seedAll
```

Cette commande crée en une fois :
- 5 utilisateurs (admin, 2 vendors, 1 customer, 1 agent)
- 2 boutiques avec leur configuration complète
- 10 produits avec vraies images uploadées sur Convex Storage

Durée estimée : 2–4 minutes (upload des images).

**Résultat attendu :**
```json
{
  "users": {
    "admin@pixel-mart.test": "Compte créé",
    "vendor@pixel-mart.test": "Compte créé",
    ...
  },
  "stores": {
    "techshop-cotonou": { "storeId": "jd7xxx", "existed": false },
    "mode-africaine": { "storeId": "jd8xxx", "existed": false }
  },
  "products": {
    "techshop-cotonou": 5,
    "mode-africaine": 5
  }
}
```

---

## Étape 3 — Désactiver le mode seed

**Immédiatement après le seed**, supprimer les variables dans Convex Dashboard :
- Supprimer `SEED_ENABLED`
- Supprimer `SEED_MODE`

La vérification email redevient obligatoire en production.

---

## Comptes de test créés

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@pixel-mart.test` | `Admin@PixelMart2025!` |
| Vendor 1 | `vendor@pixel-mart.test` | `Vendor@PixelMart2025!` |
| Vendor 2 | `vendor2@pixel-mart.test` | `Vendor2@PixelMart2025!` |
| Customer | `customer@pixel-mart.test` | `Customer@PixelMart2025!` |
| Agent | `agent@pixel-mart.test` | `Agent@PixelMart2025!` |

---

## Commandes individuelles

### Promouvoir un utilisateur existant

Utile quand tu as créé un compte via `/register` et que tu veux changer le rôle :

```bash
# Promouvoir en admin
npx convex run seed/index:promoteUser '{"email":"ton@email.com","role":"admin"}'

# Promouvoir en vendor
npx convex run seed/index:promoteUser '{"email":"ton@email.com","role":"vendor"}'

# Promouvoir en agent
npx convex run seed/index:promoteUser '{"email":"ton@email.com","role":"agent"}'
```

> Cette commande nécessite `SEED_ENABLED=true`.

---

### Seeder la boutique d'un vendor existant

Si tu as déjà un compte vendor mais pas encore de boutique ni de produits :

```bash
# Seed TechShop Cotonou (vendor@pixel-mart.test)
npx convex run seed/index:seedVendorStore '{"vendorEmail":"vendor@pixel-mart.test"}'

# Seed Mode Africaine (vendor2@pixel-mart.test)
npx convex run seed/index:seedVendorStore '{"vendorEmail":"vendor2@pixel-mart.test"}'
```

---

### Seed des catégories seulement

```bash
npx convex run categories/seed:seedCategories
```

---

### Seed des espaces publicitaires seulement

```bash
npx convex run ads/seed:seedAdSpaces
```

---

## Scénario : flow d'inscription manuelle

Si tu préfères créer tes comptes à la main via `/register` :

1. Va sur `/register`, crée le compte
2. Vérifie l'email (lien dans la boîte mail ou le dashboard Resend)
3. Connecte-toi avec le compte
4. Avec `SEED_ENABLED=true`, tourne la promotion :
   ```bash
   npx convex run seed/index:promoteUser '{"email":"ton@email.com","role":"admin"}'
   ```
5. Déconnecte-toi et reconnecte-toi → le nouveau rôle est actif

---

## Scénario : tester le dashboard admin

```bash
# 1. Activer seed mode
# → Convex Dashboard: SEED_ENABLED=true, SEED_MODE=true

# 2. Seed complet
npx convex run seed/index:seedAll

# 3. Désactiver seed mode
# → Supprimer SEED_ENABLED et SEED_MODE

# 4. Se connecter avec admin@pixel-mart.test / Admin@PixelMart2025!
# 5. Aller sur /admin/dashboard
```

---

## Scénario : tester le flow vendeur complet

```bash
# 1. Activer seed mode
# 2. Seed complet
# 3. Désactiver seed mode

# 4. Connecter vendor@pixel-mart.test / Vendor@PixelMart2025!
# 5. /vendor/dashboard → voir les métriques
# 6. /vendor/products → 5 produits listés
# 7. /vendor/store/settings → config TechShop Cotonou
# 8. /vendor/finance → solde et retraits
```

---

## Scénario : tester le checkout

```bash
# 1. Ouvrir deux onglets :
#    Onglet A → connecté en customer@pixel-mart.test
#    Onglet B → connecté en vendor@pixel-mart.test

# 2. Onglet A : /products → ajouter un produit au panier
# 3. Onglet A : /checkout → payer en mode test Moneroo

# 4. Dans le Convex Dashboard :
#    → Simuler le webhook payment.success manuellement
#    (Tools → HTTP Actions → POST /webhooks/moneroo)

# 5. Onglet B : /vendor/orders → la commande apparaît
```

---

## Réinitialiser le seed

Supprime tous les utilisateurs, boutiques et produits de test :

```bash
# DANGER — irréversible
npx convex run seed/index:wipeSeedData '{"confirm":"WIPE_SEED_DATA"}'
```

> Seuls les comptes `@pixel-mart.test` sont supprimés.

---

## Résumé des index Convex utiles

Les fonctions seed utilisent ces index — s'assurer qu'ils existent dans `schema.ts` :

| Table | Index | Champs |
|---|---|---|
| `users` | `by_email` | `email` |
| `stores` | `by_slug` | `slug` |
| `stores` | `by_owner` | `owner_id` |
| `products` | `by_store` | `store_id` |
| `products` | `by_store_slug` | `store_id, slug` |
| `categories` | `by_slug` | `slug` |

---

## Dépannage

### "Utilisateur introuvable"
Le compte n'a pas encore été créé. Lancer d'abord `seedAll` ou s'inscrire via `/register`.

### "Catégorie introuvable"
Lancer `npx convex run categories/seed:seedCategories` d'abord.

### Images non affichées
Le domaine `picsum.photos` n'est peut-être pas autorisé dans `next.config.js`. Ajouter :
```js
images: {
  remotePatterns: [{ hostname: "picsum.photos" }]
}
```
> Note : les images sont uploadées sur Convex Storage et servent via l'URL Convex — picsum n'est utilisé que lors du seed.

### "Seed désactivé"
Ajouter `SEED_ENABLED=true` dans Convex Dashboard → Settings → Environment Variables.

### Rôle non mis à jour après connexion
Déconnecter et reconnecter. La session garde le rôle de la connexion précédente.
