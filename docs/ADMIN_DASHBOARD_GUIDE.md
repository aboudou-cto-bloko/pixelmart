# Guide du Dashboard Admin — Pixel-Mart

> **Statut** : Implémenté (PR #82) — 10 pages, backend complet, config DB-first.
>
> **Accès** : Rôle `admin` uniquement — `AuthGuard roles={["admin"]}` dans le layout `/admin`.

---

## Sommaire

1. [Navigation et structure](#navigation-et-structure)
2. [Dashboard — Analytics, Monitoring, Audit](#dashboard--analytics-monitoring-audit)
3. [Pages par section](#pages-par-section)
4. [Configuration de la plateforme (`/admin/config`)](#configuration-de-la-plateforme-adminconfig)
5. [Format des clés de configuration](#format-des-clés-de-configuration)
6. [Gestion des pays et devises](#gestion-des-pays-et-devises)
7. [Gestion des tarifs de livraison](#gestion-des-tarifs-de-livraison)
8. [Gestion des publicités](#gestion-des-publicités)
9. [Accès à l'interface Agent](#accès-à-linterface-agent)

---

## Navigation et structure

Le sidebar admin est divisé en 5 sections :

| Section | Pages |
|---------|-------|
| **Plateforme** | Vue d'ensemble, Boutiques, Utilisateurs, Commandes, Catégories |
| **Financier** | Retraits |
| **Contenus** | Publicités |
| **Entrepôt** | Stockage, Interface Agent |
| **Paramètres** | Configuration, Tarifs livraison, Pays & Devises |

L'item **Interface Agent** dans la section Entrepôt est un lien direct vers `/agent` (même onglet). Il ne nécessite pas de section active.

---

## Dashboard — Analytics, Monitoring, Audit

La page `/admin/dashboard` est la tour de contrôle de la plateforme. Elle contient trois onglets.

### Onglet Analytics

Sélecteur de période : **7 jours**, **30 jours**, **90 jours**. Toutes les métriques sont comparées à la période précédente de même durée (flèche verte = hausse, rouge = baisse).

**KPIs affichés :**

| Métrique | Description |
|----------|-------------|
| GMV | Gross Merchandise Value — somme des commandes payées |
| Commissions | Revenus Pixel-Mart sur les commandes |
| Commandes payées | Nombre + panier moyen |
| Taux de conversion | % commandes payées / commandes totales créées |
| Nouveaux utilisateurs | Inscriptions sur la période |
| Nouvelles boutiques | Créations sur la période |
| Revenus publicitaires | Total des bookings pub payés |
| Revenus stockage | Factures stockage acquittées |

**Graphiques :**
- **GMV & Commissions** : barres journalières (ou hebdomadaires pour 90j)
- **Répartition statuts commandes** : camembert (pending, paid, delivered, cancelled…)
- **Boutiques par abonnement** : camembert (free, pro, business)
- **Top 10 boutiques** : leaderboard avec barre proportionnelle, tier badge et nombre de commandes

### Onglet Monitoring

Indicateurs de santé en temps réel avec code couleur :
- 🟢 **Normal** — aucune action requise
- 🟡 **Attention** — à surveiller
- 🔴 **Critique** — action requise

| Indicateur | Seuil critique |
|-----------|----------------|
| Retraits en attente | Plus ancien > 48h |
| Boutiques bloquées (dette > 30j) | > 5 boutiques |
| Commandes bloquées en « Payé » | > 20 commandes non traitées depuis 48h |
| Factures stockage en retard | > 5 factures > 30j impayées |

### Onglet Audit

Journal chronologique de toutes les **actions admin** sur la plateforme.

**Événements tracés :**

| Type | Déclencheur |
|------|------------|
| `user_banned` / `user_unbanned` | Ban / déban d'un utilisateur |
| `user_role_changed` | Changement de rôle (with: ancien → nouveau rôle) |
| `store_verified` | Vérification d'une boutique |
| `store_suspended` / `store_reactivated` | Suspension / réactivation |
| `payout_approved` / `payout_rejected` | Décision sur un retrait |
| `config_changed` | Modification d'une constante plateforme (with: ancienne → nouvelle valeur) |
| `config_reset` | Réinitialisation d'une constante |

Chaque entrée affiche : type d'action, entité cible, admin responsable, horodatage relatif ("il y a 3 min").

**Filtre** par type d'événement via les pills en haut de l'onglet.

> **Persistance** : les événements sont stockés dans la table `platform_events` (Convex). Ils ne sont jamais supprimés automatiquement.

---

## Pages par section

### Plateforme — Vue d'ensemble (`/admin/dashboard`)

KPIs en temps réel : chiffre d'affaires total, commandes actives, utilisateurs inscrits, boutiques actives, retraits en attente, revenus de stockage. Conçu comme point d'entrée principal pour détecter des anomalies.

---

### Plateforme — Utilisateurs (`/admin/users`)

Liste des 500 derniers utilisateurs. Pour chaque utilisateur :

- **Banning** : cliquer sur le bouton `Ban` → confirmation → le statut passe à `banned`. Le toggle de debannissement restaure le statut `active`.
- **Changement de rôle** : via le menu déroulant dans la colonne Rôle. Rôles disponibles : `customer`, `vendor`, `agent`, `admin`.

> ⚠️ Un admin ne peut pas changer son propre rôle ni se bannir lui-même (protection backend `requireAdmin`).

---

### Plateforme — Boutiques (`/admin/stores`)

- **Vérifier** une boutique : passe son statut à `verified` — la boutique devient pleinement opérationnelle.
- **Suspendre** : la boutique est désactivée (produits masqués du storefront).
- **Réactiver** : restaure une boutique précédemment suspendue.

---

### Plateforme — Catégories (`/admin/categories`)

CRUD complet. Les catégories peuvent être imbriquées (champ `parent_id`). Les catégories avec des sous-catégories ne peuvent pas être supprimées directement — il faut d'abord supprimer ou réassigner les enfants.

---

### Financier — Retraits (`/admin/payouts`)

- **Approuver** un retrait : déclenche le paiement via Moneroo (action `processPayout`).
- **Rejeter** : avec raison optionnelle — le solde est restauré au vendeur.

---

### Entrepôt — Stockage (`/admin/storage`)

Vue d'ensemble des demandes de stockage : pending, received, in_stock, rejected. Permet de valider ou rejeter les demandes après réception par un agent.

---

## Configuration de la plateforme (`/admin/config`)

La page `/admin/config` permet de modifier les constantes métier sans redéploiement. Les valeurs saisies ici écrasent les valeurs hardcodées dans `convex/lib/constants.ts` — ces dernières servent uniquement de **fallback** si aucune valeur n'est enregistrée en base.

### Comment modifier une valeur

1. Cliquer sur l'icône crayon (✏️) à droite de la ligne
2. Saisir la nouvelle valeur dans le champ — la conversion affichée (XOF ou durée) se met à jour en temps réel
3. Valider avec ✓ (ou annuler avec ✗)
4. La valeur est immédiatement active — aucun redéploiement nécessaire

Un badge **modifié** indique que la valeur en base diffère de la valeur par défaut du code. Le bouton ↺ (reset) supprime l'override et restaure la valeur par défaut.

---

## Format des clés de configuration

Toutes les valeurs sont des entiers. Le tableau ci-dessous détaille chaque clé, son unité, sa valeur par défaut et son effet.

### Groupe : Abonnements

| Clé | Unité | Défaut | Description |
|-----|-------|--------|-------------|
| `subscription_pro_price` | centimes XOF | `290 000` | Prix mensuel du plan Pro (2 900 XOF) |
| `subscription_business_price` | centimes XOF | `990 000` | Prix mensuel du plan Business (9 900 XOF) |
| `subscription_free_max_products` | nombre | `50` | Limite de produits actifs en plan Gratuit |

> **Note XOF** : les centimes XOF = valeur FCFA directement (5 000 centimes = 5 000 FCFA, pas 50 FCFA). Ne pas diviser par 100.

### Groupe : Commissions

Les commissions sont en **basis points** (bp). 1 bp = 0,01 %. Formule : `commission = total × bp / 10 000`.

| Clé | Unité | Défaut | Description |
|-----|-------|--------|-------------|
| `commission_free` | basis points | `500` | 5 % — plan Gratuit |
| `commission_pro` | basis points | `300` | 3 % — plan Pro |
| `commission_business` | basis points | `200` | 2 % — plan Business |

**Exemple** : Pour passer le plan Pro de 3 % à 2,5 %, saisir `250` dans `commission_pro`.

### Groupe : Délais

| Clé | Unité | Défaut | Description |
|-----|-------|--------|-------------|
| `cancellation_window_ms` | millisecondes | `7 200 000` | Délai d'annulation client après paiement (2h = 2 × 3 600 000) |
| `balance_release_delay_ms` | millisecondes | `172 800 000` | Délai avant libération du solde vendor (48h = 48 × 3 600 000) |
| `storage_debt_block_delay_ms` | millisecondes | `2 592 000 000` | Délai avant blocage retrait si facture impayée (30j = 30 × 86 400 000) |

**Référence rapide** :
```
1 heure  =  3 600 000 ms
24 heures = 86 400 000 ms
7 jours  = 604 800 000 ms
30 jours = 2 592 000 000 ms
```

### Groupe : Frais de stockage

Les valeurs sont en **centimes XOF**.

| Clé | Unité | Défaut | Description |
|-----|-------|--------|-------------|
| `storage_fee_per_unit` | centimes | `10 000` | 100 XOF par unité stockée (≤ 50 unités) |
| `storage_fee_per_unit_bulk` | centimes | `6 000` | 60 XOF par unité (> 50 unités — tarif bulk) |
| `storage_fee_bulk_threshold` | nombre | `50` | Seuil de basculement vers le tarif bulk |
| `storage_fee_medium_kg_flat` | centimes | `500 000` | Forfait 5 000 XOF pour 5–25 kg |
| `storage_fee_heavy_base` | centimes | `500 000` | Base > 25 kg : 5 000 XOF |
| `storage_fee_heavy_per_kg` | centimes | `25 000` | Surcoût > 25 kg : 250 XOF par kg supplémentaire |

> Les seuils de poids (5 kg, 25 kg) ne sont pas modifiables depuis l'UI actuellement. Ils sont définis dans `convex/lib/constants.ts : STORAGE_FEES.FREE_MAX_KG` et `MEDIUM_MAX_KG`.

---

## Gestion des pays et devises (`/admin/countries`)

La page `/admin/countries` affiche les pays supportés groupés par devise (XOF, XAF, GNF, CDF, EUR, CHF, CAD).

### Activer / désactiver un pays

Le toggle Switch à droite de chaque pays désactive immédiatement le marché :

- Le pays disparaît du sélecteur de pays dans le storefront
- Les méthodes de paiement associées à ce pays sont masquées

### Fonctionnement technique (overlay pattern)

La table `country_config` ne stocke que les **exceptions** : si un pays est désactivé, une ligne est insérée. Si aucune ligne n'existe, le pays est **actif par défaut**.

```typescript
// Un pays est actif si config?.[code] !== false
const isActive = config?.[country.code] !== false;
```

### Méthodes de paiement

Les méthodes de paiement (MTN Money, Orange Money, Wave, etc.) affichées sur chaque carte de pays sont gérées par Moneroo et reflètent les intégrations disponibles. Elles ne peuvent pas être ajoutées ou supprimées depuis ce dashboard.

---

## Gestion des tarifs de livraison (`/admin/delivery`)

La page `/admin/delivery` permet de configurer les grilles tarifaires de livraison par course.

### Structure d'un tarif

Chaque tarif est défini par :

| Champ | Description |
|-------|-------------|
| **Type de course** | `standard`, `urgent` ou `fragile` |
| **Période** | Jour (6h–21h) ou Nuit (21h–6h) |
| **Distance min/max** | Plage kilométrique couverte (`∞` = pas de limite haute) |
| **Prix de base** | Montant fixe en centimes XOF |
| **Prix/km** | Surcoût variable par km (optionnel) |
| **Seuil poids** | Au-delà de ce poids (kg), un surcoût s'applique |
| **Surcoût/kg** | Surcoût par kg dépassant le seuil, en centimes |

### Créer un tarif

Cliquer sur **Nouveau tarif** → remplir le formulaire → **Créer**.

La valeur saisie dans "Prix de base (centimes)" est affichée convertie en XOF sous le champ (ex: `150000` → `150 000 FCFA`).

### Paliers recommandés (exemple Cotonou)

```
Standard — Jour
  0–5 km   → 500 XOF base
  5–15 km  → 800 XOF base + 100 XOF/km
  > 15 km  → 1 500 XOF base + 80 XOF/km

Urgent — Jour (×1,5 vs standard)
  0–5 km   → 750 XOF base
  ...

Standard — Nuit (majoration 30 %)
  ...
```

---

## Gestion des publicités (`/admin/ads`)

La page `/admin/ads` contient deux onglets :

### Onglet Réservations

Liste toutes les réservations de spots publicitaires avec filtrage par statut. Pour chaque réservation :

- **Confirmer** : active immédiatement un booking en `pending_payment` (réservation admin gratuite)
- **Annuler** : avec raison optionnelle

### Onglet Espaces

Affiche les 5 slots disponibles. Pour chaque espace :

- **Toggle actif/inactif** : masque l'espace dans le sélecteur vendeur
- **Modifier le multiplicateur de demande** : ajuste le coefficient de surcoût dynamique (0,5× à 5,0×)
- **Modifier les tarifs** : édite le nombre de slots max et les prix par durée (jour, semaine, mois)

### Créer une réservation admin

Bouton **Réservation admin** (haut droit) → formulaire complet :
1. Sélectionner l'espace et le type (boutique, produit, cta, bannière)
2. Uploader l'image via le bouton d'upload (Convex Storage)
3. Saisir le texte CTA, le lien de destination, les dates
4. **Créer** — le booking est immédiatement `active` avec priorité 100 (admin override)

---

## Accès à l'interface Agent

L'item **Interface Agent** dans la sidebar (section Entrepôt) est un lien vers `/agent`. Cette interface est dédiée aux agents de l'entrepôt pour :

- Scanner les codes de stockage (PM-001, PM-002…)
- Saisir les mesures réelles (quantité ou poids)
- Valider la réception d'une demande de stockage

Un admin peut accéder à cette interface directement depuis le dashboard sans changer de session.
