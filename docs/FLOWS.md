# Flux métier — Pixel-Mart

Ce document décrit chaque flux bout en bout avec les acteurs, les mutations/actions impliquées, et les états intermédiaires.

---

## 1. Inscription et connexion utilisateur

### 1.1 Inscription

```
[Client] /register
    │
    ├── Formulaire : email, password (min 8 chars)
    │
    ▼
authClient.signUp.email()          ← Better Auth client SDK
    │
    ▼
Better Auth (côté serveur)
    ├── Crée l'enregistrement dans sa table interne
    ├── Trigger onCreate → convex/auth.ts
    │       └── ctx.runMutation(internal.users.mutations.createUser, {
    │               better_auth_user_id,
    │               email, name,
    │               role: "customer",          ← rôle par défaut
    │               is_banned: false,
    │               is_verified: false,
    │           })
    └── Envoie email de vérification (template VerifyEmail via Resend)
            └── Si SEED_MODE=true → vérification désactivée

[Client clique le lien de vérification]
    │
    ▼
Better Auth marque is_verified: true
    └── autoSignInAfterVerification: true → session créée automatiquement
```

### 1.2 Connexion

```
[Client] /login
    │
    ├── authClient.signIn.email({email, password})
    │
    ▼
Better Auth
    ├── Vérifie credentials
    ├── Rate limiting : 5 tentatives / 15min, lockout 30min après 5 échecs
    ├── Crée session (2 jours, refresh auto toutes les 4h)
    └── Set cookie HTTP-only pm.session_token (httpOnly, secure, sameSite=strict)

[Middleware Next.js — edge]
    ├── Chaque requête → vérifie présence du cookie
    └── Routes protégées → redirect /login si absent

[AuthGuard — client]
    ├── useCurrentUser() → api.users.queries.getMe
    │       └── resolve session → lookup users by_better_auth_id
    ├── Vérifie user.role ∈ allowedRoles[]
    └── Redirect si rôle insuffisant

[Si vendor avec plusieurs boutiques]
    └── Redirect → /vendor/select-store
            ├── stores.queries.listMyStores
            └── stores.mutations.setActiveStore → patch users.active_store_id
```

### 1.3 Déconnexion

```
authClient.signOut()
    ├── Supprime session Better Auth
    └── window.location.href = "/login"  ← full reload pour vider cache Convex
```

---

## 2. Cycle de vie d'une commande

### 2.1 Création

```
[Client] /checkout
    │
    ├── useCart() (localStorage) → items, quantities
    ├── Calcul frais livraison (api.delivery.getRate)
    ├── Validation coupon si renseigné (api.coupons.validate)
    │
    ▼
orders.mutations.createOrder({
    storeId, items, shippingAddress,
    deliveryLat, deliveryLon, deliveryDistanceKm,
    deliveryType, paymentMode, deliveryFee,
    couponCode?, notes?,
    guestEmail?, guestName?      ← checkout invité (sans compte)
})
    │
    ├── Rate limit : 5 créations/min par user
    ├── Valider chaque item : product existe, status "active", store match
    ├── Si variante : vérifier is_available
    ├── Calculer sous-total, appliquer coupon
    │
    ├── Calcul commission :
    │   commission_amount = Math.round(total_amount × commission_rate / 10_000)
    │   commission_rate depuis platform_config OU constants.ts selon tier boutique
    │
    ├── Générer order_number "PM-YYYY-NNNN"
    │
    ├── Insérer orders {
    │       status: "pending" (online) OU "paid" (COD),
    │       payment_status: "pending"
    │   }
    │
    ├── decrementInventory(items) → patch product.quantity - qty
    │   (et product_variants.quantity si variante)
    │
    ├── Si COD + guestEmail + email inconnu → compte provisoire :
    │   ├── Insert users {better_auth_user_id: null, guest_setup_token: uuid(), guest_setup_expires_at: now+7j}
    │   └── scheduler → emails.send.sendGuestAccountSetup {email, setupUrl}
    │
    └── logOrderEvent("created", actor_type: "customer")
```

### 2.1b Checkout invité (sans compte — QuickOrderSheet / shop vendeur)

```
[Visiteur non authentifié] QuickOrderSheet ou shop checkout
    │
    ├── Saisit son email (et éventuellement son nom)
    │
    ▼
orders.mutations.createOrder({
    storeId, items, shippingAddress,
    guestEmail, guestName?,
    paymentMode: "cod", ...
})
    │
    ├── getAppUser(ctx) → null (pas de session)
    ├── Cherche utilisateur par email dans users :
    │   ├── Trouvé + better_auth_user_id valide → commande liée à ce compte
    │   ├── Trouvé + better_auth_user_id null (provisoire) → réutilise le compte
    │   └── Non trouvé → crée compte provisoire :
    │           Insert users {
    │               better_auth_user_id: null,
    │               email: guestEmail, name: guestName,
    │               role: "customer", is_verified: false,
    │               guest_setup_token: uuid(),
    │               guest_setup_expires_at: now + 7j
    │           }
    │
    ├── Commande créée normalement (COD only pour invités)
    │
    └── Si compte provisoire (guest_setup_token présent) :
        scheduler → emails.send.sendGuestAccountSetup({
            email: guestEmail,
            customerName, orderNumber,
            setupUrl: "/register?token=<guest_setup_token>"
        })
            └── Email : lien d'activation valable 7 jours

[Invité clique le lien d'activation]
    └── /register?token=xxx → inscription normale Better Auth
        └── onCreate trigger → lie better_auth_user_id au compte provisoire
                └── Historique de commandes préservé
```

### 2.2 Paiement en ligne (Moneroo)

```
[Client]
    ├── actions.initiatePayment({orderId, amount, returnUrl})
    │       ├── POST Moneroo API /payments
    │       │   body: {amount, currency, metadata: {order_id, order_number, store_id}}
    │       └── mutations.setPaymentReference(orderId, reference)
    │
    └── Redirect → checkout_url (page Moneroo)

[Client effectue le paiement sur Moneroo]

[Moneroo] POST /webhooks/moneroo
    ├── verifyMonerooSignature(rawBody, sig, MONEROO_WEBHOOK_SECRET)  ← PREMIER APPEL
    │   └── Si signature invalide → 401, stop
    │
    ├── event.type === "payment.success"
    │
    └── ctx.runMutation(internal.payments.mutations.confirmPayment, {
            orderId, amount, currency, reference
        })
            │
            ├── Idempotence : si order.payment_status === "paid", skip
            ├── Valider amount ≥ order.total_amount
            ├── assertValidTransition(pending → paid)
            ├── Patch order : {status: "paid", payment_status: "paid"}
            │
            ├── netAmount = total_amount - commission_amount
            │
            ├── F-01 : Insert transaction {
            │       type: "sale", direction: "credit",
            │       amount: netAmount, balance_before, balance_after
            │   }
            ├── F-01 : Insert transaction {
            │       type: "fee", direction: "debit",
            │       amount: commission_amount
            │   }
            ├── Patch store : {pending_balance += netAmount}
            │
            ├── ctx.scheduler.runAfter(0, emails.send.sendOrderConfirmation, {orderId})
            ├── ctx.scheduler.runAfter(0, emails.send.sendNewOrderNotification, {orderId})
            └── ctx.scheduler.runAfter(0, notifications.send.notifyNewOrderInApp, {orderId})

[Moneroo] Redirect → /checkout/payment-callback?ref=...
    └── Frontend poll order status → /checkout/confirmation
```

### 2.3 Traitement vendor

```
[Vendor] /vendor/orders/[id]
    │
    ├── Marquer "En préparation"
    │   orders.mutations.updateStatus({orderId, status: "processing"})
    │       ├── assertValidTransition(paid → processing)
    │       ├── Patch order.status
    │       ├── logOrderEvent("processing")
    │       └── scheduler → notifyOrderStatusGeneric (email + in-app + push client)
    │
    ├── Marquer "Expédié" (+ tracking)
    │   orders.mutations.updateStatus({orderId, status: "shipped", trackingNumber, carrier})
    │       ├── assertValidTransition(processing → shipped)
    │       ├── Patch order.status, tracking_number, carrier
    │       ├── logOrderEvent("shipped")
    │       └── scheduler → sendOrderShipped + notifyOrderStatusInApp (shipped)
    │
    └── [Optionnel] Grouper dans un lot livraison
        delivery.mutations.createBatch({orderIds, groupingType: "manual"})
```

### 2.4 Confirmation livraison

```
[Option A — Client]
    orders.mutations.confirmDelivery({orderId})
        ├── assertValidTransition(shipped → delivered)
        ├── Patch order : {status: "delivered", delivered_at: now}
        └── scheduler → sendOrderDelivered + notifyOrderStatusInApp (delivered)

[Option B — Cron autoConfirmDelivery (toutes les 12h)]
    Pour chaque order shipped avec _creationTime > 7 jours :
        └── Même mutations que ci-dessus

[48h après delivered_at — Cron releaseBalances (toutes les heures)]
    ├── Patch store : {
    │       pending_balance -= netAmount,
    │       balance += netAmount
    │   }
    └── F-01 : Insert transaction {type: "credit", direction: "credit"}
```

### 2.5 Annulation

```
[Client annule] (dans les 2h — ORDER_CANCEL_WINDOW_MS)
    orders.mutations.cancelOrder({orderId})
        ├── Vérifie fenêtre d'annulation
        ├── Patch order : {status: "cancelled"}
        ├── restoreInventory(order.items)
        │
        ├── Si payment_status === "paid" :
        │   └── scheduler → payments.actions.initiateRefund({orderId})
        │           └── POST Moneroo /refunds
        │
        └── scheduler → sendOrderCancelled + notifyOrderStatusInApp (cancelled)

[Vendor annule] (depuis processing)
    orders.mutations.updateStatus({orderId, status: "cancelled"})
        └── Même flow restoreInventory + refund si payé
```

---

## 3. Flux de retrait vendeur

```
[Vendor] /vendor/finance/payouts
    │
    ├── payouts.queries.getPayoutEligibility
    │   Retourne : {balance, minAmount, isEligible, outstandingDebt, ...}
    │
    ├── Formulaire : amount, payout_method, payout_details
    │
    ▼
payouts.mutations.requestPayout({amount, method, details})
    │
    ├── validatePayoutRequest :
    │   ├── store.status === "active"
    │   ├── amount ≥ MIN_PAYOUT_AMOUNT (65 500 centimes)
    │   └── store.balance ≥ amount
    │
    ├── F-05 : getOutstandingDebt(store_id) → storage_debt non settled
    │   └── amountAfterDebt = amount - outstandingDebt
    │
    ├── fee = calculatePayoutFee(amountAfterDebt, method)
    ├── netAmount = amountAfterDebt - fee
    │
    ├── F-01 : Insert transaction {type: "payout", direction: "debit", status: "pending"}
    ├── Patch store.balance -= amount
    ├── Insert payouts {status: "pending", amount: netAmount, fee}
    │
    ├── Si outstandingDebt > 0 :
    │   └── scheduler → storage.mutations.settleDebtFromPayout({storeId, payoutId, debt})
    │           ├── Marque storage_invoices "deducted_from_payout"
    │           ├── Patch storage_debt.settled_at = now
    │           └── scheduler → notifyStorageDebtDeducted (email + in-app + push)
    │
    ├── scheduler → createInAppNotification vendor ("Demande de retrait soumise")
    ├── scheduler → createInAppNotification admins ("Nouveau retrait à approuver")
    │
    └── scheduler → payouts.actions.initializePayoutViaMoneroo({payoutId})
            ├── POST Moneroo /payouts {amount: netAmount, method, details}
            │   metadata: {payout_id, store_id}
            └── ctx.runMutation(internal.payouts.mutations.updatePayoutReference, {
                    payoutId, reference, status: "processing"
                })

[Moneroo] POST /webhooks/moneroo (payout.completed)
    └── payouts.mutations.confirmPayout({payoutId, reference})
            ├── payout.status → "completed"
            ├── Update transaction.status → "completed"
            └── scheduler → notifyPayoutCompleted (email + in-app + push)

[Moneroo] POST /webhooks/moneroo (payout.failed)
    └── payouts.mutations.failPayout({payoutId, reason})
            ├── payout.status → "failed"
            ├── F-01 : Insert reversal transaction {type: "credit", +payout.amount}
            ├── Patch store.balance += payout.amount
            └── scheduler → createInAppNotification (retrait échoué)
```

---

## 4. Flux module stockage

### Phase A — Création demande (Vendor)

```
[Vendor] /vendor/storage → "Nouvelle demande"
    │
    ▼
storage.mutations.createRequest({productName, estimatedQty?, productId?})
    │
    ├── Valide productName (2–200 chars)
    ├── Si productId → vérifie appartenance à la boutique
    ├── generateStorageCode() :
    │   └── COUNT(storage_requests) + 1 → "PM-{padStart(3, '0')}"
    │       Ex: PM-001, PM-102, PM-247
    │
    ├── Insert storage_requests {
    │       status: "pending_drop_off",
    │       storage_code: "PM-NNN"
    │   }
    │
    ├── scheduler → notifyStorageRequestReceived (email + in-app + push vendor)
    │   └── Email : "Votre code colis est PM-102. Écrivez-le sur votre colis."
    │
    └── scheduler → createInAppNotification pour chaque admin
            "Nouvelle demande de stockage : PM-102"
```

### Phase B — Réception entrepôt (Agent)

```
[Agent] /agent → Tab "Scanner un colis"
    │
    ├── Saisit le code PM-NNN
    ├── storage.queries.findByCode({code: "PM-102"})
    │   └── Affiche : product_name, store_name, estimated_qty
    │
    ├── Saisit les mesures réelles :
    │   measurement_type: "units" | "weight"
    │   actual_qty OU actual_weight_kg
    │   agent_notes?
    │
    ▼
storage.mutations.receiveRequest({code, measurementType, actualQty?, actualWeightKg?, notes?})
    │
    ├── requireAgent(ctx)
    ├── Lookup by_code (storage_code.toUpperCase())
    ├── Valide : status === "pending_drop_off"
    ├── Patch storage_request : {
    │       status: "received",
    │       measurement_type, actual_qty/weight,
    │       agent_id, received_at: now
    │   }
    │
    ├── scheduler → createInAppNotification admins ("Colis PM-102 réceptionné")
    └── scheduler → createInAppNotification vendor ("Votre colis a été réceptionné")
```

### Phase C — Validation et facturation (Agent ou Admin)

```
[Admin ou Agent] Valide la demande
    │
    ▼
storage.mutations.validateRequest({requestId, paymentMethod})
    │
    ├── requireAgent(ctx)  ← agents ET admins peuvent valider
    │
    ├── computeStorageFee(measurement_type, actual_qty, actual_weight_kg) :
    │   ┌─────────────────────────────────────────────────────────────────┐
    │   │ units ≤ 50    : qty × 10 000  (100 XOF/unité)                  │
    │   │ units > 50    : qty × 6 000   (60 XOF/unité — tarif bulk)      │
    │   │ weight 5–25kg : 500 000        (5 000 XOF forfait moyen)        │
    │   │ weight > 25kg : 500 000 + (kg - 25) × 25 000                   │
    │   └─────────────────────────────────────────────────────────────────┘
    │
    ├── Insert storage_invoice {
    │       status: "unpaid",
    │       amount: storage_fee,
    │       payment_method
    │   }
    │
    ├── Si payment_method === "deferred" :
    │   └── Upsert storage_debt pour la période "YYYY-MM" courante
    │           storage_debt.amount += storage_fee
    │
    ├── Patch storage_request : {
    │       status: "in_stock",
    │       storage_fee, invoice_id,
    │       admin_id, validated_at: now
    │   }
    │
    ├── Si product_id lié :
    │   └── Patch product : {
    │           quantity += actual_qty,
    │           warehouse_qty += actual_qty
    │       }
    │
    ├── scheduler → notifyStorageValidated (email + in-app + push vendor)
    └── scheduler → notifyStorageInvoiceCreated (email + in-app + push vendor)
```

### Phase D — Règlement de la dette

```
[Option A — Paiement direct Moneroo]
    [Webhook] storage_payment.success
        └── storage.mutations.confirmStoragePayment
                └── invoice.status = "paid"

[Option B — Déduction au moment du retrait]
    [requestPayout → settleDebtFromPayout]
        ├── Marque invoices "deducted_from_payout"
        ├── storage_debt.settled_at = now
        └── scheduler → notifyStorageDebtDeducted (email + in-app + push)

[Blocage F-06 — Cron notifyOverdueStorageDebts (24h)]
    Pour chaque invoice unpaid avec _creationTime < now - 30j :
        └── scheduler → createInAppNotification vendor ("Facture en retard — retraits bloqués")
```

---

## 5. Flux de notification (triple canal)

Chaque événement métier déclenche un dispatch **in-app + email + push** via un `internalAction`.

```
Mutation (ex: confirmPayment)
    │
    └── ctx.scheduler.runAfter(0, internal.notifications.send.notifyXxx, args)
            │
            │  [internalAction — "use node"]
            │
            ├── 1. IN-APP
            │   ctx.runMutation(internal.notifications.mutations.create, {
            │       userId, type, title, body, link
            │   })
            │   └── Insert notifications {is_read: false}
            │       Convex reactivity → useNotifications() mise à jour en temps réel
            │
            ├── 2. EMAIL
            │   const html = await render(<TemplateComponent {...props} />)
            │   await resend.emails.send({
            │       from: "Pixel-Mart <noreply@pixel-mart-bj.com>",
            │       to: user.email,
            │       subject: "...",
            │       html
            │   })
            │   catch(err) → log seulement, ne bloque pas
            │
            └── 3. PUSH
                ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
                    userId, title, body, url
                })
                    │  [internalAction — "use node"]
                    ├── ctx.runQuery(internal.push.queries.getSubsForUser, {userId})
                    ├── ctx.runQuery(internal.push.queries.isPushEnabled, {userId})
                    └── Promise.all(subscriptions.map(sub =>
                            webpush.sendNotification(sub, payload)
                        ))
                        └── 410 Gone → ctx.runMutation(removeStale, {endpoint})
```

**Lecture côté client** :
```javascript
// Lecture réactive (Convex)
const notifications = useQuery(api.notifications.queries.list, {limit: 20})
const unreadCount = useQuery(api.notifications.queries.unreadCount)

// Actions
useMutation(api.notifications.mutations.markRead)
useMutation(api.notifications.mutations.markAllRead)
```

**Gestion push côté client** (`usePushNotifications`) :
```javascript
// Inscription
await navigator.serviceWorker.register("/sw.js")
const sub = await swReg.pushManager.subscribe({
    applicationServerKey: NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    userVisibleOnly: true
})
await push.mutations.subscribe({endpoint, p256dh, auth, user_agent})

// sw.js — réception
self.addEventListener("push", (event) => {
    const data = event.data.json()
    self.registration.showNotification(data.title, {
        body: data.body, icon: "/icon-192.png", data: {url: data.url}
    })
})
self.addEventListener("notificationclick", (event) => {
    clients.openWindow(event.notification.data.url)
})
```

---

## 6. Flux de publicités

```
[Vendor] /vendor/ads → "Réserver un espace"
    │
    ├── ads.queries.listAvailableSpaces
    │   Retourne : espaces actifs avec prix, dimensions, slots disponibles
    │
    ├── Formulaire : ad_space_id, dates, contenu (product/image/texte)
    │
    ▼
ads.mutations.createBooking({...})
    │
    ├── Valide dates (starts_at > now, ends_at > starts_at)
    ├── Valide contenu (product appartient à la boutique)
    │
    ├── calculateBookingPrice(space, starts_at, ends_at) :
    │   durée_jours × base_price_daily × demand_multiplier × peak_multiplier
    │
    ├── Vérifie slots : activeBookings pour le slot ≤ max_slots ?
    │   ├── Non → status: "queued", priority: 10
    │   └── Oui → status: "pending", priority: 50
    │
    ├── Insert ad_booking {payment_status: "unpaid"}
    │
    └── scheduler → ads.actions.initiateAdPayment({bookingId})
            ├── POST Moneroo /payments
            │   metadata: {type: "ad_payment", booking_id}
            └── update booking.payment_status

[Client] Redirect → Moneroo checkout

[Moneroo] POST /webhooks/moneroo (ad_payment.success)
    └── ads.mutations.confirmAdPayment
            ├── booking.payment_status → "paid"
            ├── booking.status → "confirmed"
            └── F-01 : Insert transaction "ad_payment"

[Cron processAdBookings — toutes les 15min]
    ├── "confirmed" ET starts_at ≤ now → "active"
    └── "active" ET ends_at < now → "completed"

[Storefront — affichage]
    ads.queries.getActiveAdsForSlot({slotId})
        ├── Filtre : status "active", starts_at ≤ now ≤ ends_at
        ├── Tri : priority DESC (admin=100 > payé=50 > queue=10 > fallback=0)
        └── Enrichit avec product.title, product.images[0], store.name
```

---

## 7. Flux de retours produits

```
[Client] /orders/[id] → "Demander un retour"
    │
    ├── returns.queries.getEligibility :
    │   ├── order.status === "delivered" ✓
    │   ├── Pas de return existant (statut ≠ rejected) ✓
    │   └── delivered_at < now - RETURN_WINDOW_DAYS (14j) ✗ → bloqué
    │
    ├── Sélectionne les articles à retourner + motif
    │
    ▼
returns.mutations.requestReturn({orderId, items, reason, reason_category})
    │
    ├── validateReturnItems : qty retour ≤ qty commandée par item
    ├── calculateRefundAmount : sum(item.qty × item.unit_price)
    ├── Insert return_requests {status: "requested"}
    │
    ├── scheduler → notifyReturnStatus(vendorId, {isVendorNotification: true})
    └── scheduler → notifyReturnStatus(customerId, {isVendorNotification: false})

[Vendor] Approuve ou rejette
    │
    ├── returns.mutations.approveReturn({returnId})
    │   └── status → "approved"
    │       scheduler → notifyReturnStatus(client, "approved")
    │
    └── returns.mutations.rejectReturn({returnId, rejection_reason})
        └── status → "rejected"
            scheduler → notifyReturnStatus(client, "rejected")

[Vendor reçoit le colis]
    returns.mutations.markReceived({returnId})
        └── status → "received"
            scheduler → notifyReturnStatus(both, "received")

[Vendor/Admin traite le remboursement]
    returns.mutations.processRefund({returnId})
        ├── status → "refunded"
        ├── restoreInventory(return.items)
        ├── Patch order : {payment_status: "refunded", status: "refunded"}
        ├── F-01 : Insert transaction {type: "refund", direction: "debit"}
        ├── Patch store.balance -= refund_amount
        ├── scheduler → payments.actions.initiateRefund({orderId, amount})
        │       └── POST Moneroo /refunds
        └── scheduler → notifyReturnStatus(both, "refunded")
```

---

## 8. Flux de livraison groupée

```
[Vendor] /vendor/delivery → "Créer un lot"
    │
    ├── delivery.queries.listReadyForDelivery :
    │   Commandes processing/ready_for_delivery sans batch, enrichies
    │
    ├── Sélectionne les commandes
    │
    ▼
delivery.mutations.createBatch({orderIds, groupingType: "manual"})
    │
    ├── generateBatchNumber : "LOT-YYYY-NNNN"
    ├── Insert delivery_batch {status: "pending"}
    └── Patch orders {batch_id: newBatchId}

[Vendor transmet au service de livraison]
    delivery.mutations.transmitBatch({batchId})
        ├── status → "transmitted"
        ├── Patch orders liées : {status: "ready_for_delivery"}
        └── scheduler → createInAppNotification admins (optionnel)

[Génération PDF bon de livraison]
    useDeliveryBatchPDF() → @react-pdf/renderer
        └── delivery.queries.getBatch → données enrichies pour le PDF
```

---

## 9. Flux de synchronisation Better Auth ↔ Convex

```
Better Auth (interne)
    │
    ├── onCreate (nouvel utilisateur)
    │   └── auth.ts onCreateUser callback
    │       ├── Cherche compte provisoire par email (better_auth_user_id === null)
    │       │   └── Si trouvé → patch {better_auth_user_id, is_verified: true} (liaison)
    │       └── Si non trouvé → ctx.runMutation(internal.users.mutations.createUser, {
    │               better_auth_user_id,
    │               email, name, role: "customer"
    │           })
    │
    └── onDelete (soft-delete Better Auth)
        └── auth.ts onDeleteUser callback
            └── ctx.runMutation(internal.users.mutations.softBanUser, {
                    better_auth_user_id
                })
                └── Patch users.is_banned = true
                    (Utilisé uniquement comme fallback.
                     La vraie suppression passe par admin.mutations.deleteUser)

[Suppression hard-delete par admin]
    admin.mutations.deleteUser({userId})
        │
        ├── requireSuperAdmin(ctx)
        ├── Guard : ADMIN_ROLES → throw "Impossible de supprimer un admin"
        │
        ├── ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        │       input: {model: "session", where: [{field: "userId", value: better_auth_user_id}]},
        │       paginationOpts: {numItems: 200, cursor: null}
        │   })
        ├── ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        │       input: {model: "account", where: [{field: "userId", value: better_auth_user_id}]},
        │       paginationOpts: {numItems: 200, cursor: null}
        │   })
        ├── ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        │       input: {model: "user", where: [{field: "_id", value: better_auth_user_id}]}
        │   })
        │
        ├── Supprime notifications, push_subscriptions
        ├── ctx.db.delete(userId)
        └── logEvent("user_deleted")
```

---

## 10. Flux analytics vendor

```
[Vendor] /vendor/analytics
    │
    ├── Sélectionne période (7d, 30d, 90d) et source (marketplace/vendor_shop/all)
    │
    ├── analytics.queries.getSalesOverview({period, source})
    │   ├── Filtre orders payées de la boutique sur la période
    │   ├── Calcule : gmv, commissions, orders_count, aov (panier moyen)
    │   ├── Compare à la période précédente (même durée)
    │   └── Retourne % de variation
    │
    ├── analytics.queries.getRevenueChart({period, granularity})
    │   ├── Granularité : "day" (7d/30d) ou "week" (90d)
    │   └── Retourne [{date, revenue, orders}]
    │
    ├── analytics.queries.getTopProducts({period})
    │   └── Retourne [{product_id, title, revenue, units_sold}] top 10
    │
    ├── [source === "marketplace"] analytics.queries.getViewsChart({period})
    │   ├── Lit table store_views, groupe par day_bucket
    │   └── Retourne [{date, label, views}] — visiteurs uniques/jour
    │
    └── [source === "vendor_shop"] analytics.queries.getMetaFunnel({period})
        ├── Lit table meta_pixel_events filtrée par pixel_id actif
        └── Retourne {hasPixel, pixelId, funnel[{name, count, conversionRate}]}
```

### 10b. Flux tracking Meta Pixel (navigateur)

```
[Visiteur] /shop/[slug]/products/[slug]
    │
    ├── MetaPixelProvider initialise <MetaPixel pixelId={store.meta_pixel_id}>
    │   └── @adkit.so/meta-pixel-next — charge fbevents.js, auto-PageView
    │
    ├── Chaque changement de route → PageView fbq automatique (librairie)
    │   └── Si storeId + "PageView" dans enabledEvents →
    │       analytics.mutations.logBrowserPixelEvent({storeId, eventName:"PageView"})
    │
    ├── Ouverture fiche produit → ViewContent
    │   └── meta.track("ViewContent", {content_ids, value, currency})
    │       + logBrowserPixelEvent si enabledEvents.includes("ViewContent")
    │
    ├── Clic "Ajouter au panier" → AddToCart
    │   └── meta.track("AddToCart", ...) + logBrowserPixelEvent
    │
    ├── Ouverture QuickOrderSheet → InitiateCheckout
    │   └── meta.track("InitiateCheckout", ...) + logBrowserPixelEvent
    │
    └── Paiement confirmé (webhook Moneroo) → Purchase CAPI
        └── meta/mutations.trackPurchase (serveur) →
            ctx.scheduler.runAfter(0, sendPurchaseEvent) +
            ctx.db.insert("meta_pixel_events", {source:"server", pixel_id, ...})
```

---

## 11. Flux de publication des avis

```
[Cron autoPublishReviews — toutes les heures]
    │
    ├── Cherche reviews avec :
    │   ├── is_published: false
    │   ├── flagged: false
    │   └── _creationTime < now - 24h
    │
    ├── Pour chaque review :
    │   ├── Patch review.is_published = true
    │   ├── Recalcule product.avg_rating :
    │   │   avg = sum(published ratings) / count(published ratings)
    │   └── ctx.runAction(internal.notifications.send.notifyNewReview, {reviewId})
    │
    └── notifyNewReview (internalAction)
        ├── createInAppNotification vendeur
        ├── resend.emails.send(<NewReview />)
        └── push.actions.sendToUser vendeur
```

---

## Interactions inter-modules — résumé

```
payments/webhooks ──────▶ payments/mutations (confirmPayment, failPayment)
                    ├───▶ ads/mutations (confirmAdPayment, failAdPayment)
                    ├───▶ payouts/mutations (confirmPayout, failPayout)
                    └───▶ storage/mutations (confirmStoragePayment, failStoragePayment)

orders/mutations ───────▶ notifications/send (via scheduler)
                    └───▶ emails/send (via scheduler)

payments/mutations ─────▶ notifications/send (via scheduler)
                    └───▶ emails/send (via scheduler)

payouts/mutations ──────▶ storage/mutations.settleDebtFromPayout (via scheduler)
                    └───▶ payouts/actions.initializePayoutViaMoneroo (via scheduler)

storage/mutations ──────▶ notifications/send (via scheduler)

notifications/send ─────▶ notifications/mutations.create (runMutation)
                    ├───▶ resend API (direct call)
                    └───▶ push/actions.sendToUser (via scheduler)

push/actions ───────────▶ push/queries.getSubsForUser (runQuery)
                    └───▶ push/mutations.removeStale (runMutation si 410)

crons ──────────────────▶ notifications/send (runAction)
                    └───▶ (direct DB writes)
```
