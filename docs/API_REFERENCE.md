# Référence API Convex — Pixel-Mart

Toutes les fonctions Convex exposées au frontend via `api.*` et les fonctions internes `internal.*`. Les fonctions internes ne sont appelables que depuis le backend.

> **Légende** : 🔓 public (tout le monde) · 👤 authentifié · 🛒 customer · 🏪 vendor · 🔧 agent · 👑 superAdmin · 🏛️ admin (tous rôles admin)

---

## `users`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.users.queries.getMe` | 🔓 | `{}` | `Doc<"users"> \| null` | Utilisateur connecté via session Better Auth |

### Helpers internes (non exposés)

| Fonction | Description |
|----------|-------------|
| `getAppUser(ctx)` | Résout session → `Doc<"users"> \| null` |
| `requireAppUser(ctx)` | Throw si null ou banni |
| `requireVendor(ctx)` | Throw si rôle ≠ vendor/admin |
| `requireAdmin(ctx)` | Accepte tous les ADMIN_ROLES |
| `requireSuperAdmin(ctx)` | Accepte uniquement "admin" |
| `requireAgent(ctx)` | Accepte agent ou admin |
| `getVendorStore(ctx)` | requireVendor + boutique active |

---

## `stores`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.stores.queries.getBySlug` | 🔓 | `{slug}` | Store + stats | Vitrine publique |
| `api.stores.queries.getMyStore` | 🏪 | `{}` | `Doc<"stores">` | Boutique active du vendeur |
| `api.stores.queries.listMyStores` | 🏪 | `{}` | `Doc<"stores">[]` | Toutes les boutiques du vendeur |
| `api.stores.queries.hasPendingOrders` | 🏪 | `{}` | `boolean` | Vérifie commandes actives |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.stores.mutations.create` | 🏪 | `{name, slug, country, ...}` | Crée une boutique |
| `api.stores.mutations.updateSettings` | 🏪 | `{name?, description?, contact_*?, ...}` | Paramètres boutique |
| `api.stores.mutations.updateTheme` | 🏪 | `{theme_id, primary_color?, theme_mode?}` | Thème boutique |
| `api.stores.mutations.updateMeta` | 🏪 | `{meta_pixel_id?, vendor_shop_enabled?}` | Meta Pixel + vitrine |
| `api.stores.mutations.setActiveStore` | 🏪 | `{storeId}` | Change la boutique active |

---

## `products`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.products.queries.getById` | 🔓 | `{productId}` | Produit + variantes + URLs résolues | — |
| `api.products.queries.getBySlug` | 🔓 | `{storeSlug, productSlug}` | Produit complet + store | Page produit |
| `api.products.queries.listByStore` | 🏪 | `{status?, search?}` | `Doc<"products">[]` | Catalogue vendeur |
| `api.products.queries.search` | 🔓 | `{query, storeId?, categoryId?}` | Produits matching | Full-text search |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.products.mutations.create` | 🏪 | `{title, price, images, categoryId, ...}` | Crée produit + variants |
| `api.products.mutations.update` | 🏪 | `{productId, ...}` | Met à jour produit + variants |
| `api.products.mutations.delete` | 🏪 | `{productId}` | Archive (status → "archived") |
| `api.products.mutations.updateStatus` | 🏪 | `{productId, status}` | Publie / dépublie |
| `api.products.mutations.generateUploadUrl` | 🏪 | `{}` | URL upload Convex storage |

---

## `categories`

### Queries

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.categories.queries.list` | 🔓 | `{}` | Toutes les catégories actives |
| `api.categories.queries.getBySlug` | 🔓 | `{slug}` | Catégorie par slug |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.categories.mutations.create` | 🏛️ | `{name, slug, parent_id?, ...}` | Crée catégorie |
| `api.categories.mutations.update` | 🏛️ | `{categoryId, ...}` | Modifie catégorie |
| `api.categories.mutations.delete` | 🏛️ | `{categoryId}` | Supprime catégorie |

---

## `orders`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.orders.queries.getById` | 👤 | `{orderId}` | Order enrichi | Accès customer/vendor/admin uniquement |
| `api.orders.queries.getByOrderNumber` | 👤 | `{orderNumber}` | Order + store_name | Recherche par numéro |
| `api.orders.queries.listByCustomer` | 🛒 | `{status?}` | Orders[] | Commandes du client |
| `api.orders.queries.listByStore` | 🏪 | `{status?, limit?}` | Orders[] enrichis | Commandes de la boutique |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.orders.mutations.createOrder` | 👤 | `{storeId, items, shippingAddress, deliveryLat/Lon, deliveryFee, deliveryType, paymentMode, ...}` | Crée commande, décrémente stock |
| `api.orders.mutations.updateStatus` | 🏪 | `{orderId, status, trackingNumber?, carrier?}` | Transitions vendeur (processing/shipped/delivered) |
| `api.orders.mutations.cancelOrder` | 🛒 | `{orderId}` | Annule dans la fenêtre 2h |
| `api.orders.mutations.confirmDelivery` | 🛒 | `{orderId}` | Confirmation de réception |

---

## `payments`

### Actions publiques

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.payments.actions.initiatePayment` | 👤 | `{orderId, returnUrl}` | Initie paiement Moneroo, retourne `{checkout_url, reference}` |

### Mutations internes

| Fonction | Appelé par | Description |
|----------|-----------|-------------|
| `internal.payments.mutations.confirmPayment` | Webhook | Confirme paiement, crédite solde vendeur |
| `internal.payments.mutations.failPayment` | Webhook | Marque échec paiement |
| `internal.payments.mutations.setPaymentReference` | Action | Stocke référence Moneroo |

---

## `payouts`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.payouts.queries.list` | 🏪 | `{limit?}` | Payouts[] | Historique retraits boutique |
| `api.payouts.queries.getPayoutEligibility` | 🏪 | `{}` | `{balance, minAmount, isEligible, outstandingDebt}` | Éligibilité retrait |
| `api.payouts.queries.getPending` | 🏛️ | `{}` | Payouts pending | Dashboard admin |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.payouts.mutations.requestPayout` | 🏪 | `{amount, payout_method, payout_details}` | Demande de retrait |
| `api.payouts.mutations.approvePayout` | 👑 | `{payoutId, notes?}` | Approbation admin |
| `api.payouts.mutations.rejectPayout` | 👑 | `{payoutId, reason}` | Rejet admin |

---

## `storage`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.storage.queries.getByStore` | 🏪 | `{status?}` | Requests[] | Demandes de la boutique |
| `api.storage.queries.getStats` | 🏪 | `{}` | `{in_stock_count, pending_count, outstanding_debt, ...}` | Stats rapides |
| `api.storage.queries.getAll` | 🏛️ | `{status?}` | Requests[] enrichis | Dashboard admin |
| `api.storage.queries.findByCode` | 🔧 | `{code}` | Request + store_name | Scan agent |
| `api.storage.queries.listAllForAgent` | 🔧 | `{status?}` | Requests[] | Vue pipeline agent |
| `api.storage.queries.getInvoices` | 🏪 | `{}` | Invoices[] | Factures de la boutique |
| `api.storage.queries.getDebt` | 🏪 | `{}` | Debt records | Dettes de la boutique |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.storage.mutations.createRequest` | 🏪 | `{productName, estimatedQty?, productId?}` | Crée demande de stockage, génère code PM-NNN |
| `api.storage.mutations.receiveRequest` | 🔧 | `{code, measurementType, actualQty?, actualWeightKg?, notes?}` | Réception entrepôt par agent |
| `api.storage.mutations.validateRequest` | 🔧 | `{requestId, paymentMethod}` | Valide + génère facture |
| `api.storage.mutations.rejectRequest` | 🏛️ | `{requestId, reason}` | Rejette la demande |

---

## `notifications`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.notifications.queries.list` | 👤 | `{limit?, onlyUnread?}` | Notifications[] | Liste paginée |
| `api.notifications.queries.unreadCount` | 👤 | `{}` | `number` | Badge non-lues |
| `api.notifications.queries.getById` | 👤 | `{notificationId}` | Notification | Détail |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.notifications.mutations.markRead` | 👤 | `{notificationId}` | Marque une notification lue |
| `api.notifications.mutations.markAllRead` | 👤 | `{}` | Marque toutes lues |

---

## `push`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.push.queries.getStatus` | 👤 | `{}` | `{enabled, deviceCount}` | Statut push de l'utilisateur |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.push.mutations.subscribe` | 👤 | `{endpoint, p256dh, auth, user_agent?}` | Enregistre subscription push |
| `api.push.mutations.unsubscribe` | 👤 | `{endpoint}` | Supprime subscription |
| `api.push.mutations.setEnabled` | 👤 | `{enabled}` | Active/désactive les push |

---

## `reviews`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.reviews.queries.listByProduct` | 🔓 | `{productId}` | Reviews publiées | Page produit |
| `api.reviews.queries.listByStore` | 🏪 | `{limit?}` | Toutes les reviews | Dashboard vendor |
| `api.reviews.queries.getEligibility` | 🛒 | `{productId}` | `{canReview, reason?}` | Vérifie éligibilité |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.reviews.mutations.create` | 🛒 | `{productId, orderId, rating, body?, images?}` | Soumet un avis (achat vérifié requis) |
| `api.reviews.mutations.addVendorReply` | 🏪 | `{reviewId, reply}` | Réponse du vendeur |
| `api.reviews.mutations.flag` | 👤 | `{reviewId}` | Signale pour modération |

---

## `returns`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.returns.queries.listByStore` | 🏪 | `{status?}` | Returns[] | Retours reçus par la boutique |
| `api.returns.queries.listByCustomer` | 🛒 | `{}` | Returns[] | Retours du client |
| `api.returns.queries.getById` | 👤 | `{returnId}` | Return enrichi | Détail |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.returns.mutations.requestReturn` | 🛒 | `{orderId, items, reason, reason_category}` | Demande de retour |
| `api.returns.mutations.approveReturn` | 🏪 | `{returnId}` | Approbation vendor |
| `api.returns.mutations.rejectReturn` | 🏪 | `{returnId, rejection_reason}` | Rejet vendor |
| `api.returns.mutations.markReceived` | 🏪 | `{returnId}` | Marque colis reçu |
| `api.returns.mutations.processRefund` | 🏪 | `{returnId}` | Traite le remboursement |

---

## `coupons`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.coupons.queries.listByStore` | 🏪 | `{}` | Coupons[] | Coupons de la boutique |
| `api.coupons.queries.validate` | 🔓 | `{code, storeId, orderAmount, items?}` | `{valid, discount, type, value}` | Validation coupon |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.coupons.mutations.create` | 🏪 | `{code, type, value, ...}` | Crée coupon |
| `api.coupons.mutations.update` | 🏪 | `{couponId, ...}` | Modifie coupon |
| `api.coupons.mutations.delete` | 🏪 | `{couponId}` | Supprime coupon |
| `api.coupons.mutations.toggle` | 🏪 | `{couponId}` | Active/désactive |

---

## `delivery`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.delivery.queries.listReadyForDelivery` | 🏪 | `{}` | Orders enrichis | Commandes sans lot assigné |
| `api.delivery.queries.listBatches` | 🏪 | `{status?}` | Batches[] | Lots de la boutique |
| `api.delivery.queries.getBatch` | 🏪 | `{batchId}` | Batch + orders | Détail d'un lot |
| `api.delivery.queries.getRate` | 🔓 | `{distanceKm, type, weightKg?}` | `{fee, breakdown}` | Calcul frais |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.delivery.mutations.createBatch` | 🏪 | `{orderIds, groupingType}` | Crée lot de livraison |
| `api.delivery.mutations.transmitBatch` | 🏪 | `{batchId}` | Transmet au service livraison |
| `api.delivery.mutations.cancelBatch` | 🏪 | `{batchId}` | Annule lot |

---

## `ads`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.ads.queries.getActiveAdsForSlot` | 🔓 | `{slotId}` | AdBookings enrichis | Annonces actives (storefront) |
| `api.ads.queries.listAvailableSpaces` | 🏪 | `{}` | AdSpaces[] | Catalogue espaces (vendeur) |
| `api.ads.queries.listMyBookings` | 🏪 | `{}` | Bookings[] | Réservations de la boutique |
| `api.ads.queries.listAdSpaces` | 🏛️ | `{}` | AdSpaces avec stats | Dashboard admin |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.ads.mutations.createBooking` | 🏪 | `{adSpaceId, starts_at, ends_at, content_type, ...}` | Réserve un espace pub |
| `api.ads.mutations.adminCreateBooking` | 👑 | `{adSpaceId, ...}` | Réservation gratuite admin |
| `api.ads.mutations.cancelBooking` | 🏪 | `{bookingId}` | Annule réservation |
| `api.ads.mutations.updateAdSpace` | 👑 | `{adSpaceId, ...}` | Modifie espace pub |

---

## `analytics`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.analytics.queries.getSalesOverview` | 🏪 | `{period, source?}` | KPIs + % variation | Tableau de bord vendeur |
| `api.analytics.queries.getRevenueChart` | 🏪 | `{period, granularity}` | `[{date, revenue, orders}]` | Graphique revenus |
| `api.analytics.queries.getTopProducts` | 🏪 | `{period}` | Top 10 produits | Performances catalogue |
| `api.analytics.queries.getOrdersByStatus` | 🏪 | `{period}` | Distribution statuts | Répartition commandes |

---

## `admin`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.admin.queries.getPlatformStats` | 🏛️ | `{}` | Stats globales + alerts + top stores + revenue 30j | Tableau de bord |
| `api.admin.queries.getAnalytics` | 🏛️ | `{period}` | KPIs + series + topStores + distributions | Analytics plateforme |
| `api.admin.queries.getPlatformHealth` | 🏛️ | `{}` | Indicateurs santé temps réel | Monitoring |
| `api.admin.queries.listAuditLog` | 🏛️ | `{limit?, type?}` | Events[] | Journal d'audit |
| `api.admin.queries.listUsers` | 🏛️ | `{}` | Users[] | Liste utilisateurs |
| `api.admin.queries.listStores` | 🏛️ | `{}` | Stores[] enrichis | Liste boutiques |
| `api.admin.queries.listOrders` | 🏛️ | `{status?}` | Orders[] enrichis | Commandes plateforme |
| `api.admin.queries.listPendingPayouts` | 🏛️ | `{}` | Payouts pending | File retraits |
| `api.admin.queries.listAllPayouts` | 🏛️ | `{}` | 100 derniers payouts | Historique |
| `api.admin.queries.listStorageRequests` | 🏛️ | `{}` | Requests "received" | À valider |
| `api.admin.queries.listAdSpaces` | 🏛️ | `{}` | Spaces + stats | Gestion pubs |
| `api.admin.queries.getPlatformConfig` | 🏛️ | `{}` | Config map | Configuration |
| `api.admin.queries.listDeliveryRates` | 🏛️ | `{}` | Rates[] | Grille tarifaire |
| `api.admin.queries.listCountryConfig` | 🏛️ | `{}` | `{country_code: is_active}` | Config pays |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.admin.mutations.verifyStore` | 👑 | `{storeId}` | Vérifie boutique, notifie vendeur |
| `api.admin.mutations.suspendStore` | 👑 | `{storeId, reason}` | Suspend boutique |
| `api.admin.mutations.reactivateStore` | 👑 | `{storeId}` | Réactive boutique |
| `api.admin.mutations.banUser` | 👑 | `{userId}` | Bannit utilisateur |
| `api.admin.mutations.unbanUser` | 👑 | `{userId}` | Débannit utilisateur |
| `api.admin.mutations.changeUserRole` | 👑 | `{userId, role}` | Modifie le rôle |
| `api.admin.mutations.deleteUser` | 👑 | `{userId}` | Hard-delete Better Auth + app |
| `api.admin.mutations.bulkBanUsers` | 👑 | `{userIds}` | Bannit en masse |
| `api.admin.mutations.bulkUnbanUsers` | 👑 | `{userIds}` | Débannit en masse |
| `api.admin.mutations.bulkDeleteUsers` | 👑 | `{userIds}` | Supprime en masse |
| `api.admin.mutations.bulkVerifyStores` | 👑 | `{storeIds}` | Vérifie en masse |
| `api.admin.mutations.bulkSuspendStores` | 👑 | `{storeIds, reason}` | Suspend en masse |
| `api.admin.mutations.approvePayout` | 🏛️ | `{payoutId, notes?}` | Approuve retrait |
| `api.admin.mutations.rejectPayout` | 🏛️ | `{payoutId, reason}` | Rejette retrait |
| `api.admin.mutations.updatePlatformConfig` | 🏛️ | `{key, value}` | Modifie config, log audit |
| `api.admin.mutations.resetPlatformConfig` | 👑 | `{key}` | Remet la valeur par défaut |
| `api.admin.mutations.updateCountryConfig` | 🏛️ | `{countryCode, isActive}` | Active/désactive un pays |
| `api.admin.mutations.updateDeliveryRate` | 🏛️ | `{rateId, ...}` | Modifie grille tarifaire |
| `api.admin.mutations.updateAdSpace` | 👑 | `{adSpaceId, ...}` | Modifie espace publicitaire |

---

## `messages`

### Queries

| Fonction | Accès | Args | Retourne | Description |
|----------|-------|------|----------|-------------|
| `api.messages.queries.listThreads` | 👤 | `{}` | Threads[] | Liste des conversations |
| `api.messages.queries.listByThread` | 👤 | `{threadId}` | Messages[] | Messages d'une conversation |

### Mutations

| Fonction | Accès | Args | Description |
|----------|-------|------|-------------|
| `api.messages.mutations.send` | 👤 | `{receiverId, storeId?, orderId?, content}` | Envoie un message |
| `api.messages.mutations.markRead` | 👤 | `{threadId}` | Marque thread comme lu |

---

## Fonctions internes (backend only)

Ces fonctions ne sont pas accessibles depuis le frontend. Elles sont appelées via `ctx.runMutation`, `ctx.runAction`, ou `ctx.scheduler.runAfter`.

### `internal.notifications.send.*`
Dispatchers notifications. Chacun prend les données contextuelles et exécute les 3 canaux (in-app, email, push).

| Fonction | Déclenché par |
|----------|--------------|
| `notifyNewOrderInApp` | `payments/mutations.confirmPayment` |
| `notifyOrderStatusGeneric` | `orders/mutations.updateStatus` (processing) |
| `notifyOrderStatusInApp` | `orders/mutations.updateStatus` (shipped/delivered/cancelled) |
| `notifyPayoutCompleted` | `payouts/mutations.confirmPayout` |
| `notifyLowStock` | `crons.checkLowStock` |
| `notifyReturnStatus` | `returns/mutations.*` |
| `notifyStorageRequestReceived` | `storage/mutations.createRequest` |
| `notifyStorageValidated` | `storage/mutations.validateRequest` |
| `notifyStorageRejected` | `storage/mutations.rejectRequest` |
| `notifyStorageInvoiceCreated` | `storage/mutations.validateRequest` |
| `notifyStorageInvoicePaid` | `storage/mutations.confirmStoragePayment` |
| `notifyStorageDebtDeducted` | `storage/mutations.settleDebtFromPayout` |
| `createInAppNotification` | Tout le reste (new order vendor, admin alerts, etc.) |

### `internal.emails.send.*`
Envoi d'emails via Resend (actions "use node").

| Fonction | Template | Déclencheur |
|----------|----------|-------------|
| `sendOrderConfirmation` | `OrderConfirmation` | `confirmPayment` |
| `sendNewOrderNotification` | `NewOrder` | `confirmPayment` |
| `sendOrderShipped` | `OrderShipped` | `updateStatus(shipped)` |
| `sendOrderDelivered` | `OrderDelivered` | `updateStatus(delivered)` |
| `sendOrderCancelled` | `OrderCancelled` | `cancelOrder` / `updateStatus(cancelled)` |

### `internal.push.actions.sendToUser`
Action "use node". Envoie une notification Web Push à tous les appareils d'un utilisateur.

```typescript
args: { userId: Id<"users">, title: string, body: string, url?: string }
```

### `internal.payments.actions.initiateRefund`
Initie un remboursement Moneroo.

```typescript
args: { orderId: Id<"orders">, amount?: number }
```

### `internal.payouts.actions.initializePayoutViaMoneroo`
Initie un retrait via l'API Moneroo.

```typescript
args: { payoutId: Id<"payouts"> }
```

---

## Hooks React (frontend)

| Hook | Fichier | Description |
|------|---------|-------------|
| `useCurrentUser()` | `hooks/useCurrentUser.ts` | `useQuery(api.users.queries.getMe)` avec helpers de rôle |
| `useCart()` | `hooks/useCart.ts` | Panier localStorage (add, remove, update, clear) |
| `useNotifications()` | `hooks/useNotifications.ts` | Liste + unreadCount + markRead + markAllRead |
| `usePushNotifications()` | `hooks/usePushNotifications.ts` | SW registration, subscribe, unsubscribe, setEnabled |
| `usePayouts()` | `hooks/usePayouts.ts` | Eligibilité + historique + requestPayout |
| `useBulkSelection()` | `hooks/useBulkSelection.ts` | `Set<string>` avec toggle, toggleAll, clear, isAllSelected, count |
| `useAddressAutocomplete()` | `hooks/useAddressAutocomplete.ts` | Nominatim geocoding + debounce (1 req/sec) |
| `useInvoiceDownload()` | `hooks/useInvoiceDownload.ts` | Génération PDF facture via @react-pdf/renderer |
| `useDeliveryBatchPDF()` | `hooks/useDeliveryBatchPDF.tsx` | Génération PDF bon de livraison |
| `useMobile()` | `hooks/use-mobile.ts` | Breakpoint mobile (< 768px) |
