# Modèle de données — Pixel-Mart

Le fichier `convex/schema.ts` est la **source de vérité absolue**. Ce document en est la référence lisible.

---

## Diagramme des relations (simplifié)

```
users ──────────────────────────────────────────────────────────────────┐
  │ 1                                                                    │
  │ owner_id                                                             │
  ▼ N                                                                    │
stores ─────────────────────────────────────────────────────────────────┤
  │ 1                           │ 1           │ 1                       │
  │ store_id                    │ store_id    │ store_id                │
  ▼ N                           ▼ N           ▼ N                      │
products         orders ─────▶ transactions  payouts                   │
  │ 1              │ 1                                                  │
  ▼ N              ▼ N                                                  │
product_variants  order_events                                          │
product_specs                                                           │
                  orders ──────────────────────────────────────────────┤
                    │ customer_id                                       │
                    ▼                                                   │
                  users ◀─────────────────────────────────────────────┘

reviews ──────────▶ products
reviews ──────────▶ orders
reviews ──────────▶ users (customer)

return_requests ──▶ orders
return_requests ──▶ users (customer)
return_requests ──▶ stores

storage_requests ──▶ stores
storage_requests ──▶ products (optionnel)
storage_invoices ──▶ storage_requests
storage_invoices ──▶ stores
storage_debt ──────▶ stores

notifications ─────▶ users
push_subscriptions ▶ users

ad_bookings ────────▶ ad_spaces
ad_bookings ────────▶ stores (optionnel)
ad_bookings ────────▶ products (optionnel)

delivery_batches ───▶ stores
delivery_batches ───▶ orders (array)

coupons ────────────▶ stores
messages ───────────▶ users (sender + receiver)
platform_events ────▶ users (actor)
```

---

## Tables

### `users`
Profil applicatif Pixel-Mart. Synchronisé depuis Better Auth via le trigger `onCreate`. Source de vérité pour rôles, état du compte, préférences.

| Champ | Type | Description |
|-------|------|-------------|
| `better_auth_user_id` | string | FK vers table interne Better Auth |
| `email` | string | Dénormalisé depuis Better Auth |
| `name` | string | Dénormalisé depuis Better Auth |
| `avatar_url` | string? | URL d'avatar |
| `phone` | string? | Format E.164 (+22961234567) |
| `role` | union | `"admin" \| "finance" \| "logistics" \| "developer" \| "marketing" \| "vendor" \| "customer" \| "agent"` |
| `is_2fa_enabled` | boolean | 2FA activé |
| `totp_secret` | string? | Secret TOTP chiffré AES-256 |
| `is_verified` | boolean | Email vérifié |
| `is_banned` | boolean | Compte banni (accès refusé) |
| `last_login_at` | number? | Timestamp dernière connexion |
| `locale` | `"fr" \| "en"` | Langue préférée |
| `active_store_id` | Id\<"stores"\>? | Boutique active (multi-store) |
| `push_notifications_enabled` | boolean? | Push activé (défaut: true) |
| `updated_at` | number | Timestamp dernière modification |

**Indexes** : `by_better_auth_id`, `by_email`, `by_role`

---

### `stores`
Boutique d'un vendeur. Contient la configuration financière, l'apparence, le statut et les paramètres métier.

| Champ | Type | Description |
|-------|------|-------------|
| `owner_id` | Id\<"users"\> | Propriétaire |
| `name` | string | Nom de la boutique |
| `slug` | string | URL-safe, unique globalement |
| `description` | string? | Description HTML sanitisé |
| `logo_url` | string? | Logo |
| `banner_url` | string? | Bannière |
| `theme_id` | string | `"default" \| "modern" \| "classic" \| "royal" \| "nature"` |
| `primary_color` | string? | Couleur principale (hex) |
| `theme_mode` | string? | `"light" \| "dark"` |
| `status` | string | `"active" \| "suspended" \| "pending" \| "closed"` |
| `subscription_tier` | string | `"free" \| "pro" \| "business"` |
| `subscription_ends_at` | number? | Expiration abonnement |
| `commission_rate` | number | Taux commission en basis points (200=2%, 500=5%) |
| `balance` | number | Centimes disponibles pour retrait |
| `pending_balance` | number | Centimes en attente de release (F-03) |
| `currency` | string | Défaut XOF |
| `level` | string | `"bronze" \| "silver" \| "gold" \| "platinum"` |
| `total_orders` | number | Compteur dénormalisé |
| `avg_rating` | number? | Note moyenne |
| `is_verified` | boolean | Vérification admin |
| `country` | string | ISO alpha-2 |
| `meta_pixel_id` | string? | Meta Pixel ID |
| `meta_access_token` | string? | Token Meta CAPI |
| `meta_test_event_code` | string? | Code test CAPI |
| `vendor_shop_enabled` | boolean? | Active /shop/[slug] |
| `use_pixelmart_service` | boolean? | Participe au service de livraison Pixel-Mart |
| `has_storage_plan` | boolean? | Utilise l'entrepôt Pixel-Mart (mode `full`) |
| `custom_pickup_lat/lon/label` | mixed? | Point de collecte custom (requis si `delivery_only`) |

**Mode de service (tri-état)** — combinaison des deux champs :

| Mode | `use_pixelmart_service` | `has_storage_plan` | Signification |
|------|------------------------|-------------------|---------------|
| `full` | `true` | `true` | Livraison + entrepôt Pixel-Mart |
| `delivery_only` | `true` | `false` | Livraison Pixel-Mart, stock chez le vendeur |
| `none` | `false` | `false` | Gestion totalement indépendante |
| `contact_*` | string? | phone, whatsapp, email, website, facebook, instagram |
| `updated_at` | number | — |

**Indexes** : `by_owner`, `by_slug`, `by_status`, `by_subscription`

---

### `categories`
Arbre de catégories produits. Maximum 2 niveaux (racine + sous-catégorie).

| Champ | Type | Description |
|-------|------|-------------|
| `name` | string | Nom affiché |
| `slug` | string | URL-safe unique |
| `parent_id` | Id\<"categories"\>? | Null = catégorie racine |
| `icon_url` | string? | Icône |
| `sort_order` | number | Ordre d'affichage |
| `is_active` | boolean | Visibilité |

**Indexes** : `by_slug`, `by_parent`, `by_sort`

---

### `products`
Catalogue produit d'une boutique. Supporte physique et numérique, stock, variantes, SEO.

| Champ | Type | Description |
|-------|------|-------------|
| `store_id` | Id\<"stores"\> | — |
| `title` | string | Titre |
| `slug` | string | URL-safe par store |
| `description` | string? | HTML sanitisé |
| `short_description` | string? | Extrait texte |
| `category_id` | Id\<"categories"\> | — |
| `tags` | string[] | Mots-clés |
| `images` | string[] | URLs Convex storage (min 1) |
| `image_roles` | string[]? | Rôles images : `"main" \| "usage" \| "zoom" \| "detail" \| "lifestyle"` |
| `price` | number | Centimes |
| `compare_price` | number? | Prix barré (centimes) |
| `cost_price` | number? | Prix de revient (centimes) |
| `sku` | string? | — |
| `barcode` | string? | — |
| `track_inventory` | boolean | Gestion de stock active |
| `quantity` | number | Stock disponible |
| `warehouse_qty` | number? | Unités en entrepôt Pixel-Mart |
| `low_stock_threshold` | number | Seuil alerte (défaut 5) |
| `avg_rating` | number? | Calculé par `autoPublishReviews` cron |
| `review_count` | number? | — |
| `weight` | number? | Grammes |
| `color`, `material`, `dimensions` | string? | Attributs physiques |
| `status` | string | `"draft" \| "active" \| "archived" \| "out_of_stock"` |
| `is_digital` | boolean | Produit numérique |
| `digital_file_url` | string? | URL fichier téléchargeable |
| `seo_title`, `seo_description`, `seo_keywords` | string? | SEO |
| `published_at` | number? | Timestamp publication |
| `updated_at` | number | — |

**Indexes** : `by_store`, `by_slug`, `by_category`, `by_status([store_id, status])`, `by_store_active([store_id, status, published_at])`

**Search index** : `search_title` (searchField: `title`, filterFields: `store_id`, `category_id`, `status`)

---

### `product_variants`
Déclinaisons d'un produit (couleur, taille). Héritent du prix du produit parent si `price` null.

| Champ | Type | Description |
|-------|------|-------------|
| `product_id` | Id\<"products"\> | — |
| `store_id` | Id\<"stores"\> | Dénormalisé pour index |
| `title` | string | Ex: "Rouge / XL" |
| `options` | array | `[{name: "Couleur", value: "Rouge"}]` |
| `price` | number? | Override prix produit (centimes) |
| `compare_price` | number? | — |
| `sku` | string? | — |
| `quantity` | number | Stock de la variante |
| `image_url` | string? | — |
| `weight` | number? | Grammes |
| `is_available` | boolean | — |

**Indexes** : `by_product`, `by_store`

---

### `product_specs`
Caractéristiques techniques clé-valeur (ex: Matériau = Coton).

| Champ | Type | Description |
|-------|------|-------------|
| `product_id` | Id\<"products"\> | — |
| `store_id` | Id\<"stores"\> | Dénormalisé |
| `spec_key` | string | Ex: "Matériau" |
| `spec_value` | string | Ex: "100% Coton" |
| `display_order` | number | Ordre d'affichage |

**Indexes** : `by_product`, `by_store`

---

### `orders`
Commande d'un client. Les items sont des **snapshots** (immutables) de l'état au moment de la commande. Machine d'état stricte.

| Champ | Type | Description |
|-------|------|-------------|
| `order_number` | string | Format "PM-2026-0001" |
| `customer_id` | Id\<"users"\> | — |
| `store_id` | Id\<"stores"\> | — |
| `items` | array | Snapshots : `{product_id, variant_id?, title, sku?, image_url, quantity, unit_price, total_price, storage_code?}` |
| `subtotal` | number | Centimes |
| `shipping_amount` | number | Frais de livraison (centimes) |
| `discount_amount` | number | Remise coupon (centimes) |
| `total_amount` | number | Centimes (= subtotal + shipping - discount) |
| `currency` | string | — |
| `status` | string | Voir machine d'état ci-dessous |
| `payment_status` | string | `"pending" \| "paid" \| "failed" \| "refunded"` |
| `payment_method` | string? | — |
| `payment_reference` | string? | ID Moneroo |
| `shipping_address` | object | Adresse complète snapshot |
| `billing_address` | object? | — |
| `tracking_number` | string? | — |
| `carrier` | string? | — |
| `estimated_delivery` | number? | Timestamp estimé |
| `delivered_at` | number? | Timestamp livraison réelle |
| `commission_amount` | number? | Centimes commission plateforme |
| `delivery_lat/lon` | number | Coordonnées livraison |
| `delivery_distance_km` | number | Distance totale |
| `delivery_type` | string | `"standard" \| "urgent" \| "fragile"` |
| `payment_mode` | string | `"online" \| "cod"` (contre remboursement) |
| `delivery_fee` | number | Centimes |
| `batch_id` | Id\<"delivery_batches"\>? | Lot de livraison |
| `source` | string | `"marketplace" \| "vendor_shop"` |
| `updated_at` | number | — |

**Machine d'état** :
```
pending ──────────────────────────────────────▶ cancelled (client < 2h)
   │
   ▼ (webhook payment.success)
 paid ────────────────────────────────────────▶ cancelled (client/vendor < 2h)
   │                                                  │
   ▼ (vendor)                                         ▼ (si payé)
processing ──────────────────────────────────▶ cancelled (vendor)
   │                                                  │
   ▼ (vendor + tracking)                              ▼
shipped                                         [refund Moneroo]
   │
   ▼ (client OU cron +7j)
delivered ─────────────────────────────────────▶ refunded (admin/vendor)
   │
   ▼ (cron +48h)
[pending_balance → balance] (F-03)

paid/delivered ─────────────────────────────────▶ refunded
```

**Indexes** : `by_customer`, `by_store`, `by_status([store_id, status])`, `by_order_number`, `by_payment_status`, `by_batch`, `by_ready_for_delivery`, `by_source([store_id, source])`

---

### `order_events`
Journal immuable de la timeline d'une commande.

| Champ | Type | Description |
|-------|------|-------------|
| `order_id` | Id\<"orders"\> | — |
| `store_id` | Id\<"stores"\> | Dénormalisé |
| `type` | string | `"created" \| "paid" \| "processing" \| "shipped" \| "delivered" \| "cancelled" \| "refunded" \| "tracking_updated" \| "note"` |
| `description` | string | Texte lisible |
| `actor_type` | string | `"system" \| "customer" \| "vendor" \| "admin"` |
| `actor_id` | Id\<"users"\>? | — |
| `metadata` | object? | Données contextuelles |

**Indexes** : `by_order`, `by_store`

---

### `transactions`
**Ledger financier immuable** (F-01). Ne jamais modifier un enregistrement existant — créer un reversal.

| Champ | Type | Description |
|-------|------|-------------|
| `store_id` | Id\<"stores"\> | — |
| `order_id` | Id\<"orders"\>? | Référence commande liée |
| `type` | string | `"sale" \| "refund" \| "payout" \| "fee" \| "credit" \| "transfer" \| "ad_payment" \| "subscription"` |
| `direction` | string | `"credit" \| "debit"` |
| `amount` | number | Centimes, toujours positif |
| `currency` | string | — |
| `balance_before` | number | Snapshot solde avant opération |
| `balance_after` | number | Snapshot solde après opération |
| `status` | string | `"pending" \| "completed" \| "failed" \| "reversed"` |
| `reference` | string? | ID Moneroo |
| `description` | string | Texte lisible |
| `metadata` | object? | — |
| `processed_at` | number? | Timestamp traitement |

**Indexes** : `by_store`, `by_type([store_id, type])`, `by_order`

---

### `payouts`
Demandes de retrait vendeur.

| Champ | Type | Description |
|-------|------|-------------|
| `store_id` | Id\<"stores"\> | — |
| `amount` | number | Centimes demandés (min 65 500) |
| `currency` | string | — |
| `fee` | number | Frais plateforme (centimes) |
| `status` | string | `"pending" \| "processing" \| "completed" \| "failed" \| "cancelled"` |
| `payout_method` | string | `"bank_transfer" \| "mobile_money" \| "paypal"` |
| `payout_details` | object | `{provider, account_name?, account_number?, bank_code?, phone_number?}` |
| `reference` | string? | ID Moneroo |
| `requires_2fa` | boolean | 2FA requis |
| `verified_2fa` | boolean | 2FA vérifié |
| `transaction_id` | Id\<"transactions"\>? | Transaction liée |
| `requested_at` | number | Timestamp demande |
| `processed_at` | number? | Timestamp traitement |
| `notes` | string? | Notes admin |

**Indexes** : `by_store`, `by_status([store_id, status])`, `by_status_only([status])`

---

### `reviews`
Avis client sur un produit. L'achat vérifié (`is_verified`) est obligatoire. Publication différée de 24h via cron.

| Champ | Type | Description |
|-------|------|-------------|
| `product_id` | Id\<"products"\> | — |
| `order_id` | Id\<"orders"\> | Achat vérifié |
| `customer_id` | Id\<"users"\> | — |
| `store_id` | Id\<"stores"\> | Dénormalisé |
| `rating` | number | 1 à 5 |
| `title` | string? | Titre |
| `body` | string? | Contenu |
| `images` | string[] | Photos (URLs Convex storage) |
| `is_verified` | boolean | Achat confirmé |
| `is_published` | boolean | Publié (false jusqu'à `autoPublishReviews`) |
| `flagged` | boolean | Signalé pour modération |
| `vendor_reply` | string? | Réponse du vendeur |
| `replied_at` | number? | Timestamp réponse |

**Indexes** : `by_product`, `by_store`, `by_customer`

---

### `product_questions`
Q&R produits entre clients et vendeurs.

| Champ | Type | Description |
|-------|------|-------------|
| `product_id` | Id\<"products"\> | — |
| `store_id` | Id\<"stores"\> | Dénormalisé |
| `author_id` | Id\<"users"\> | — |
| `source` | string | `"customer" \| "vendor"` |
| `body` | string | Question ou réponse |
| `is_published` | boolean | — |
| `vendor_answer` | string? | — |
| `answered_at` | number? | — |

**Indexes** : `by_product`, `by_store`, `by_author`

---

### `coupons`
Codes promo créés par les vendeurs.

| Champ | Type | Description |
|-------|------|-------------|
| `store_id` | Id\<"stores"\> | — |
| `code` | string | Uppercase, unique par store |
| `type` | string | `"percentage" \| "fixed_amount" \| "free_shipping"` |
| `value` | number | % ou centimes |
| `min_order_amount` | number? | Montant minimum (centimes) |
| `max_uses` | number? | Limite globale d'utilisations |
| `max_uses_per_user` | number | Limite par client |
| `used_count` | number | Compteur |
| `applicable_to` | string | `"all" \| "specific_products" \| "specific_categories"` |
| `product_ids` | Id\<"products"\>[]? | — |
| `category_ids` | Id\<"categories"\>[]? | — |
| `starts_at` | number? | Timestamp début validité |
| `expires_at` | number? | Timestamp fin validité |
| `is_active` | boolean | — |

**Indexes** : `by_store`, `by_code([store_id, code])`

---

### `return_requests`
Demandes de retour produit après livraison.

| Champ | Type | Description |
|-------|------|-------------|
| `order_id` | Id\<"orders"\> | — |
| `store_id` | Id\<"stores"\> | Dénormalisé |
| `customer_id` | Id\<"users"\> | — |
| `items` | array | Snapshots `{product_id, variant_id?, title, quantity, unit_price}` |
| `status` | string | `"requested" → "approved" → "received" → "refunded"` ou `"rejected"` |
| `reason` | string | Description libre |
| `reason_category` | string | `"defective" \| "wrong_item" \| "not_as_described" \| "changed_mind" \| "damaged_in_transit" \| "other"` |
| `refund_amount` | number | Centimes à rembourser |
| `vendor_notes` | string? | — |
| `rejection_reason` | string? | — |
| `requested_at` | number | — |
| `approved_at`, `received_at`, `refunded_at` | number? | Timestamps du workflow |
| `refund_reference` | string? | ID Moneroo du remboursement |

**Indexes** : `by_order`, `by_store`, `by_customer`, `by_store_status`

---

### `messages`
Messagerie entre client et boutique.

| Champ | Type | Description |
|-------|------|-------------|
| `thread_id` | string | Clé composite `"${store_id}_${customer_id}"` |
| `sender_id` | Id\<"users"\> | — |
| `receiver_id` | Id\<"users"\> | — |
| `order_id` | Id\<"orders"\>? | Contexte commande |
| `store_id` | Id\<"stores"\>? | — |
| `content` | string | Texte du message |
| `attachments` | string[] | URLs |
| `is_read` | boolean | — |
| `read_at` | number? | — |
| `is_auto` | boolean | Message automatique (système) |

**Indexes** : `by_thread`, `by_receiver([receiver_id, is_read])`

---

### `notifications`
Notifications in-app. Les 3 canaux (in-app, email, push) sont gérés séparément mais déclenchés ensemble.

| Champ | Type | Description |
|-------|------|-------------|
| `user_id` | Id\<"users"\> | Destinataire |
| `type` | string | Voir tableau des types dans CLAUDE.md |
| `title` | string | Titre affiché |
| `body` | string | Contenu |
| `link` | string? | URL de navigation au clic |
| `is_read` | boolean | — |
| `channels` | string[] | Canaux utilisés |
| `sent_via` | string[] | Canaux réellement envoyés |
| `metadata` | object? | Données contextuelles |

**Indexes** : `by_user`, `by_user_unread([user_id, is_read])`

---

### `push_subscriptions`
Subscriptions Web Push par appareil/navigateur.

| Champ | Type | Description |
|-------|------|-------------|
| `user_id` | Id\<"users"\> | — |
| `endpoint` | string | URL endpoint push du navigateur |
| `p256dh` | string | Clé publique ECDH |
| `auth` | string | Secret d'authentification |
| `user_agent` | string? | Browser identifier |
| `created_at` | number | — |

**Indexes** : `by_user`, `by_endpoint`

---

### `ad_spaces`
Catalogue des emplacements publicitaires (géré par l'admin).

| Champ | Type | Description |
|-------|------|-------------|
| `slot_id` | string | Identifiant unique : "hero_main", "mid_banner"... |
| `name` | string | Nom affiché |
| `format` | string | `"banner" \| "card" \| "logo" \| "spotlight"` |
| `width`, `height` | number | Dimensions en pixels |
| `max_slots` | number | Nombre d'emplacements simultanés |
| `base_price_daily/weekly/monthly` | number | Centimes |
| `demand_multiplier` | number | Multiplicateur (1.0 = normal) |
| `peak_periods` | array? | `[{name, starts_at, ends_at, multiplier}]` |
| `is_active` | boolean | Visible aux vendeurs |
| `sort_order` | number | Ordre d'affichage |

**Indexes** : `by_slot_id`, `by_active`

---

### `ad_bookings`
Réservations d'espaces publicitaires.

| Champ | Type | Description |
|-------|------|-------------|
| `ad_space_id` | Id\<"ad_spaces"\> | — |
| `slot_id` | string | Dénormalisé |
| `store_id` | Id\<"stores"\>? | Réservation vendeur |
| `booked_by` | Id\<"users"\> | — |
| `content_type` | string | `"product" \| "store" \| "banner" \| "promotion"` |
| `product_id`, `image_url`, `title`, `subtitle`, `cta_text`, `cta_link`, `background_color` | mixed? | Contenu de l'annonce |
| `starts_at`, `ends_at` | number | Timestamps |
| `total_price` | number | Centimes |
| `source` | string | `"vendor" \| "admin"` |
| `priority` | number | 100=admin, 50=payé, 10=queue, 0=fallback |
| `status` | string | `"pending" \| "confirmed" \| "active" \| "completed" \| "cancelled" \| "queued"` |
| `payment_status` | string | `"unpaid" \| "paid" \| "refunded" \| "waived"` |
| `impressions`, `clicks` | number | Métriques |

**Indexes** : `by_slot`, `by_store`, `by_status`, `by_active_slot([slot_id, status, priority])`, `by_period`

---

### `delivery_batches`
Lots de livraison groupant plusieurs commandes.

| Champ | Type | Description |
|-------|------|-------------|
| `batch_number` | string | Format "LOT-2026-0001" |
| `store_id` | Id\<"stores"\> | — |
| `created_by` | Id\<"users"\> | — |
| `order_ids` | Id\<"orders"\>[] | Commandes incluses |
| `order_count` | number | Dénormalisé |
| `grouping_type` | string | `"zone" \| "manual"` |
| `status` | string | `"pending" → "transmitted" → "assigned" → "in_progress" → "completed"` ou `"cancelled"` |
| `transmitted_at`, `assigned_at`, `completed_at` | number? | Timestamps workflow |
| `total_delivery_fee` | number | Centimes total |

**Indexes** : `by_store`, `by_status`, `by_store_status`, `by_batch_number`

---

### `storage_requests`
Demandes de mise en stock entrepôt Pixel-Mart.

| Champ | Type | Description |
|-------|------|-------------|
| `store_id` | Id\<"stores"\> | — |
| `product_id` | Id\<"products"\>? | Si lié à un produit catalogue |
| `storage_code` | string | Format "PM-NNN" — généré à la création |
| `product_name` | string | Snapshot nom produit |
| `estimated_qty` | number? | Estimation vendeur |
| `measurement_type` | string? | `"units" \| "weight"` — rempli par l'agent |
| `actual_qty` | number? | Quantité réelle (agent) |
| `actual_weight_kg` | number? | Poids réel (agent) |
| `status` | string | `"pending_drop_off" → "received" → "in_stock"` ou `"rejected"` |
| `agent_id` | Id\<"users"\>? | Agent qui a réceptionné |
| `received_at` | number? | — |
| `agent_notes` | string? | — |
| `admin_id` | Id\<"users"\>? | Admin/agent qui a validé |
| `validated_at` | number? | — |
| `rejection_reason` | string? | — |
| `storage_fee` | number? | Centimes facturés |
| `invoice_id` | Id\<"storage_invoices"\>? | Facture associée |

**Indexes** : `by_store`, `by_code([storage_code])`, `by_status`, `by_store_status`, `by_product`

---

### `storage_invoices`
Factures de stockage. Créées à la validation d'une demande.

| Champ | Type | Description |
|-------|------|-------------|
| `store_id` | Id\<"stores"\> | — |
| `request_id` | Id\<"storage_requests"\> | — |
| `amount` | number | Centimes |
| `currency` | string | — |
| `status` | string | `"unpaid" \| "paid" \| "deducted_from_payout"` |
| `payment_method` | string? | `"immediate" \| "auto_debit" \| "deferred"` |
| `payment_reference` | string? | ID Moneroo |
| `paid_at` | number? | — |

**Indexes** : `by_store`, `by_request`, `by_status([store_id, status])`

---

### `storage_debt`
Dette mensuelle de stockage (mode "deferred"). Déduite en priorité sur les retraits (F-05).

| Champ | Type | Description |
|-------|------|-------------|
| `store_id` | Id\<"stores"\> | — |
| `amount` | number | Centimes |
| `currency` | string | — |
| `period` | string | Format "YYYY-MM" |
| `invoice_ids` | Id\<"storage_invoices"\>[] | Factures incluses |
| `settled_at` | number? | Timestamp règlement |
| `payout_id` | Id\<"payouts"\>? | Retrait qui a soldé la dette |

**Indexes** : `by_store`, `by_store_period([store_id, period])`, `by_unsettled([store_id, settled_at])`

---

### `delivery_rates`
Grille tarifaire de livraison. **Source de vérité principale** pour le calcul des frais. Configurée via `/admin/delivery`. Les constantes de `convex/lib/constants.ts` servent de **fallback** si aucun taux actif ne correspond.

| Champ | Type | Description |
|-------|------|-------------|
| `delivery_type` | string | `"standard" \| "urgent" \| "fragile"` |
| `is_night_rate` | boolean | Tarif nuit (21h–06h) |
| `distance_min_km` | number | Distance minimum de la tranche (km) |
| `distance_max_km` | number? | Distance maximum (null = illimité) |
| `base_price` | number | Prix de base (centimes) |
| `price_per_km` | number? | Centimes par km au-delà du seuil |
| `weight_threshold_kg` | number | Seuil poids sans supplément (kg) |
| `weight_surcharge_per_kg` | number | Supplément par kg au-dessus du seuil (centimes) |
| `is_active` | boolean | Taux actif (seuls les actifs sont utilisés dans les calculs) |

**Indexes** : `by_type([delivery_type, is_night_rate, is_active])`

**Accès** :
- Backend : `ctx.db.query("delivery_rates").withIndex("by_type").collect()` dans `orders/mutations.createOrder`
- Frontend : `api.delivery.queries.getActiveRates` via le hook `useDeliveryRates()`

---

### `platform_config`
Constantes configurables par l'admin. Override de `convex/lib/constants.ts`.

| Champ | Type | Description |
|-------|------|-------------|
| `key` | string | Identifiant unique (ex: "commission_rate_free") |
| `value` | number | Valeur numérique |
| `label` | string | Libellé affiché en admin |
| `updated_at` | number | — |
| `updated_by` | Id\<"users"\>? | Admin qui a modifié |

**Indexes** : `by_key`

---

### `platform_events`
Journal d'audit admin. Toutes les actions administratives y sont tracées.

| Champ | Type | Description |
|-------|------|-------------|
| `type` | string | Ex: "store_verified", "user_banned", "bulk_action"... |
| `actor_id` | Id\<"users"\> | Admin auteur |
| `actor_name` | string? | Dénormalisé |
| `target_type` | string? | "user", "store", "payout"... |
| `target_id` | string? | ID de la cible |
| `target_label` | string? | Nom lisible de la cible |
| `metadata` | string? | JSON stringify des données contextuelles |
| `created_at` | number | — |

**Indexes** : `by_type([type, created_at])`, `by_actor([actor_id, created_at])`, `by_created_at`

---

### `country_config`
Activation/désactivation des pays pour la marketplace.

| Champ | Type | Description |
|-------|------|-------------|
| `country_code` | string | ISO alpha-2 |
| `is_active` | boolean | — |
| `updated_at` | number | — |
| `updated_by` | Id\<"users"\>? | — |

**Indexes** : `by_code`

---

### `waitlist`
Captures de leads pré-lancement.

| Champ | Type | Description |
|-------|------|-------------|
| `email` | string | — |
| `name` | string? | — |
| `role` | string | `"vendor" \| "customer"` |
| `created_at` | number | — |

**Indexes** : `by_email`

---

## Constantes financières (`convex/lib/constants.ts`)

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `MIN_PAYOUT_AMOUNT` | 65 500 | Retrait minimum en centimes (655 XOF) |
| `COMMISSION_RATE_FREE` | 500 | 5% (basis points) |
| `COMMISSION_RATE_PRO` | 300 | 3% |
| `COMMISSION_RATE_BUSINESS` | 200 | 2% |
| `STORAGE_FEE_PER_UNIT` | 10 000 | 100 XOF/unité (≤ 50 unités) |
| `STORAGE_FEE_BULK_UNIT` | 6 000 | 60 XOF/unité (> 50 unités) |
| `STORAGE_FEE_MEDIUM_KG` | 500 000 | 5 000 XOF forfait 5–25 kg |
| `STORAGE_FEE_HEAVY_BASE` | 500 000 | 5 000 XOF base pour > 25 kg |
| `STORAGE_FEE_HEAVY_PER_KG` | 25 000 | 250 XOF/kg au-delà de 25 kg |
| `BALANCE_RELEASE_DELAY_MS` | 172 800 000 | 48h en ms (F-03) |
| `LOW_STOCK_DEFAULT_THRESHOLD` | 5 | Seuil alerte stock |
| `RETURN_WINDOW_DAYS` | 14 | Fenêtre retour produit (jours) |
| `ORDER_CANCEL_WINDOW_MS` | 7 200 000 | 2h en ms (fenêtre annulation) |
