# FAQ — Configurer le SAV (Service Après-Vente)

> Ce guide couvre la configuration du service après-vente sur Pixel-Mart : annulations, retours, remboursements, réclamations, et communication avec les clients.

---

## Table des matières

1. [Annulations de commande](#1-annulations-de-commande)
2. [Retours et remboursements](#2-retours-et-remboursements)
3. [Communication avec les clients](#3-communication-avec-les-clients)
4. [Notifications et alertes SAV](#4-notifications-et-alertes-sav)
5. [Configuration des délais et fenêtres SAV](#5-configuration-des-délais-et-fenêtres-sav)
6. [Côté Admin — supervision des litiges](#6-côté-admin--supervision-des-litiges)

---

## 1. Annulations de commande

### Qui peut annuler une commande ?

| Acteur | Statuts autorisés | Conditions |
|--------|------------------|-----------|
| Client | `pending`, `paid` | Dans la fenêtre de 2h après la commande |
| Vendeur | `processing` | À tout moment — déclenche un remboursement si `payment_status: "paid"` |
| Admin | `paid`, `delivered` | Pour les cas exceptionnels / litiges |

### Que se passe-t-il côté paiement lors d'une annulation ?

- **Commande non payée** (`payment_status: "pending"`) : annulation sèche, aucun remboursement.
- **Commande payée en ligne** (`payment_status: "paid"`, `payment_mode: "online"`) : le système déclenche automatiquement un remboursement via Moneroo (`requestRefund`). Le client reçoit une notification email + push.
- **Commande COD** (`payment_mode: "cod"`) : marquée directement comme `refunded` sans appel Moneroo (aucun paiement n'a transité par la plateforme).

> **Important** : annuler une commande en statut `delivered` ou `shipped` est **interdit** par la machine d'état. Si besoin, l'admin doit traiter cela comme un retour.

### Comment un vendeur annule-t-il une commande ?

1. Aller sur `/vendor/orders/[id]`
2. Cliquer sur **Annuler la commande** (disponible uniquement au statut `processing`)
3. Saisir un motif (optionnel)
4. La commande passe à `cancelled`, le stock est restauré, et le remboursement est déclenché si applicable.

### La fenêtre d'annulation client est-elle configurable ?

Oui. L'admin peut modifier le délai depuis `/admin/config` → champ `cancellation_window_minutes` (défaut : 120 minutes). Cette valeur est stockée dans `platform_config` et surpasse la constante `CANCELLATION_WINDOW_MINUTES` de `convex/lib/constants.ts`.

---

## 2. Retours et remboursements

### Quelle est la politique de retour par défaut ?

Les clients disposent d'une fenêtre de **14 jours** après la livraison pour soumettre une demande de retour. Passé ce délai, le bouton "Demander un retour" n'est plus affiché.

### Comment un client initie-t-il un retour ?

1. Aller sur `/orders/[id]/return`
2. Sélectionner les articles à retourner
3. Indiquer le motif (produit défectueux, non conforme, erreur de commande…)
4. Soumettre — crée un enregistrement `return_requests` avec statut `requested`

### Cycle de vie d'une demande de retour

```
requested
    │
    ├── Vendeur approuve → approved
    │       └── Le vendeur attend la réception physique du colis
    │
    ├── Vendeur refuse → rejected
    │       └── Notification client (motif inclus)
    │
    ▼
received          ← Le colis est physiquement retourné au vendeur
    │
    ▼
refunded          ← Remboursement déclenché via Moneroo (si paiement online)
                     ou marqué manuellement (COD)
```

### Comment le vendeur traite-t-il une demande de retour ?

Route : `/vendor/orders/returns`

| Action | Résultat |
|--------|---------|
| **Approuver** | Statut → `approved`, client notifié de renvoyer le colis |
| **Refuser** | Statut → `rejected`, client notifié avec le motif |
| **Marquer reçu** | Statut → `received`, attente du remboursement |
| **Rembourser** | Déclenche le virement Moneroo → statut `refunded` |

> Le remboursement peut aussi être déclenché par l'admin depuis `/admin/orders/[id]`.

### Le remboursement est-il automatique après approbation ?

Non. Le remboursement est déclenché **manuellement** par le vendeur (ou l'admin) une fois le colis physiquement reçu. Cela prévient les remboursements sans retour effectif.

### Les frais de livraison sont-ils remboursés ?

Par défaut, les frais de livraison ne font pas partie du calcul de remboursement — seul le montant produit est remboursé. La politique exacte est laissée à la discrétion du vendeur.

---

## 3. Communication avec les clients

### Comment configurer les informations de contact de la boutique ?

Route : `/vendor/store/settings` → section "Contact"

| Champ | Usage |
|-------|-------|
| Téléphone (`contact_phone`) | Affiché sur la fiche boutique, lien `tel:` |
| WhatsApp (`contact_whatsapp`) | Bouton WhatsApp sur la boutique personnalisée |
| Email (`contact_email`) | Adresse de contact publique |
| Site web | Lien externe |
| Facebook / Instagram | Liens réseaux sociaux |

> Ces informations sont également affichées dans la fiche boutique sur la marketplace et dans le shop personnalisé `/shop/[slug]`.

### Comment répondre aux questions clients sur les produits ?

Les clients peuvent poser des questions sur les fiches produits. Le vendeur reçoit une **notification push** et peut répondre depuis `/vendor/notifications` ou directement depuis la fiche produit.

Flux :
1. Client pose une question → `notifyNewQuestion` → push notification au vendeur
2. Vendeur répond → `notifyQuestionAnswered` → push notification au client

### La messagerie directe vendeur ↔ client est-elle disponible ?

Oui. Le module `messages` permet une messagerie directe. Accessible via `/vendor/orders/[id]` pour les échanges liés à une commande.

### Comment répondre aux avis clients ?

Route : `/vendor/reviews`

Le vendeur peut publier une réponse publique sur chaque avis. La réponse est visible sur la fiche produit. Le client est notifié via push (`notifyReviewReplied`).

---

## 4. Notifications et alertes SAV

### Quelles notifications sont envoyées automatiquement au client ?

| Événement | Canaux |
|-----------|--------|
| Commande confirmée (paiement reçu) | Email (`OrderConfirmation`) + in-app |
| Commande expédiée | Email (`OrderShipped`) + in-app + push |
| Commande livrée | Email (`OrderDelivered`) + in-app + push |
| Commande annulée | Email (`OrderCancelled`) + in-app + push |
| Statut → en préparation | Email (`OrderStatusUpdate`) + in-app + push |
| Demande de retour : approuvée/refusée/remboursée | Email (`ReturnStatusUpdate`) + in-app + push |
| Réponse à une question | Push (`notifyQuestionAnswered`) |
| Réponse à un avis | Push (`notifyReviewReplied`) |

### Quelles notifications sont envoyées automatiquement au vendeur ?

| Événement | Canaux |
|-----------|--------|
| Nouvelle commande | Email (`NewOrder`) + in-app + push |
| Demande de retour reçue | Email (`ReturnStatusUpdate`) + in-app + push |
| Stock faible | Email (`LowStockAlert`) + in-app + push (cron toutes les 4h) |
| Nouvelle question sur un produit | Push (`notifyNewQuestion`) |
| Nouvel avis publié | Email (`NewReview`) + in-app + push |

### Le client peut-il désactiver les notifications push ?

Oui. Le client peut gérer ses préférences push depuis son profil. Côté vendeur : `/vendor/notifications` → toggle "Notifications push".

La désactivation met `push_notifications_enabled: false` sur le `users` record. Les envois push vérifient ce flag avant l'envoi.

---

## 5. Configuration des délais et fenêtres SAV

Tous les délais SAV sont configurables par l'admin depuis `/admin/config`. Les valeurs par défaut sont dans `convex/lib/constants.ts`.

| Paramètre | Clé `platform_config` | Défaut | Description |
|-----------|-----------------------|--------|-------------|
| Fenêtre d'annulation | `cancellation_window_minutes` | 120 min | Délai pendant lequel le client peut annuler |
| Libération du solde | `balance_release_hours` | 48h | Délai après livraison avant crédit vendeur |
| Confirmation automatique | — (cron `autoConfirmDelivery`) | 7 jours | Commande `shipped` → `delivered` auto après 7j |
| Blocage retrait (dette stockage) | `storage_debt_block_days` | 30 jours | Facture impayée bloquant les retraits |
| Expiration demande stockage | — (cron `expireStaleStorageRequests`) | 30 jours | Demande `pending_drop_off` → `rejected` |

> Pour modifier un délai : `/admin/config` → modifier la valeur → **Sauvegarder**. La modification est effective immédiatement pour les prochains calculs (pas de déploiement nécessaire).

---

## 6. Côté Admin — supervision des litiges

### Comment l'admin supervise-t-il les retours ?

Route : `/admin/orders` → filtre par statut `refunded` ou via les demandes de retour

L'admin peut :
- Forcer le remboursement d'une commande payée (`paid` ou `delivered`)
- Voir l'historique complet d'une commande via les `order_events`
- Consulter le journal d'audit (`platform_events`) pour tracer toute action admin

### Comment traiter un litige client-vendeur ?

1. Identifier la commande dans `/admin/orders/[id]`
2. Consulter les `order_events` (timeline complète)
3. Si remboursement nécessaire : action **Rembourser** → déclenche `requestRefund`
4. Si annulation nécessaire : action **Annuler** (disponible sur statuts `paid` et `delivered` côté admin)
5. Journaliser l'action dans `platform_events` (automatique pour toute action admin)

### Comment bannir un vendeur en cas d'abus SAV ?

Route : `/admin/stores/[id]` → **Suspendre la boutique**

La boutique passe à `status: "suspended"`. Les produits ne sont plus visibles et les nouvelles commandes sont bloquées. Les commandes existantes restent traitables.

Pour un cas grave : `/admin/users/[id]` → **Bannir l'utilisateur** → met `is_banned: true`, toutes les sessions sont invalidées.

### Comment configurer les taux de commission par niveau d'abonnement ?

Route : `/admin/config` → section "Commissions"

| Clé | Description | Défaut |
|-----|-------------|--------|
| `commission_rate_free` | Taux Free en basis points | 500 (5%) |
| `commission_rate_pro` | Taux Pro | 300 (3%) |
| `commission_rate_business` | Taux Business | 200 (2%) |

> `basis_points / 10 000 = taux`. Exemple : 500 bp = 5%.

La commission est calculée sur `(subtotal - discount)`, **hors frais de livraison** (règle F-04).

---

## Résumé des routes SAV par acteur

| Acteur | Route | Action |
|--------|-------|--------|
| Client | `/orders` | Voir ses commandes |
| Client | `/orders/[id]/return` | Soumettre une demande de retour |
| Vendeur | `/vendor/orders` | Gérer les commandes |
| Vendeur | `/vendor/orders/returns` | Traiter les demandes de retour |
| Vendeur | `/vendor/reviews` | Répondre aux avis |
| Vendeur | `/vendor/store/settings` | Configurer les infos de contact |
| Vendeur | `/vendor/notifications` | Gérer les préférences de notification |
| Admin | `/admin/orders` | Supervision globale des commandes |
| Admin | `/admin/orders/[id]` | Forcer remboursement / annulation |
| Admin | `/admin/config` | Configurer délais et fenêtres SAV |
| Admin | `/admin/stores/[id]` | Suspendre une boutique |
| Admin | `/admin/users/[id]` | Bannir un utilisateur |
