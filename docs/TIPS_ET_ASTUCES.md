# Tips & Astuces — Pixel-Mart

Ce document regroupe les conseils pratiques et astuces avancées pour tirer le meilleur parti de Pixel-Mart, organisés par profil utilisateur.

---

## Table des matières

1. [Astuces clients](#1-astuces-clients)
2. [Astuces vendeurs — Catalogue](#2-astuces-vendeurs--catalogue)
3. [Astuces vendeurs — Commandes et livraison](#3-astuces-vendeurs--commandes-et-livraison)
4. [Astuces vendeurs — Finances](#4-astuces-vendeurs--finances)
5. [Astuces vendeurs — Visibilité et croissance](#5-astuces-vendeurs--visibilité-et-croissance)
6. [Astuces admins](#6-astuces-admins)
7. [Astuces techniques / power users](#7-astuces-techniques--power-users)

---

## 1. Astuces clients

### Utilisez la liste de souhaits comme panier différé
La liste de souhaits est persistée en base de données (et non en localStorage comme le panier). Elle survive à tous les appareils — ajoutez des articles depuis votre téléphone, achetez-les depuis votre ordinateur plus tard.

### Le panier survit même déconnecté
Le panier est stocké en localStorage. Vous pouvez faire vos ajouts sans être connecté — la connexion n'est demandée qu'au moment du paiement.

### Calculez vos frais de livraison avant de choisir
Avant de finaliser votre adresse, essayez plusieurs formulations — la recherche Nominatim est précise au niveau de la rue. Une adresse plus précise donne un calcul de distance (Haversine) plus juste, et donc des frais de livraison potentiellement plus bas.

### Comparez les boutiques pour un même produit
Plusieurs vendeurs peuvent vendre le même article. Utilisez la recherche `/products` et filtrez — regardez la note de la boutique et son délai d'expédition habituel avant de choisir.

### Le paiement à la livraison, c'est sans risque
Choisissez le **Cash on Delivery** pour les premières commandes chez un nouveau vendeur. Le remboursement en cas de retour est tout aussi rapide qu'avec un paiement en ligne.

### Les codes promo ne s'appliquent qu'une fois
Si un code promo a une limite d'utilisation par utilisateur, il sera refusé à la deuxième tentative. Vérifiez les contraintes dans la bannière promotionnelle du vendeur.

### Activez les notifications push
Pour ne jamais rater un changement de statut de commande, activez les **notifications push** depuis votre profil. Elles fonctionnent même lorsque l'onglet Pixel-Mart est fermé.

---

## 2. Astuces vendeurs — Catalogue

### Soignez le premier visuel — c'est le seul affiché dans la grille
La grille produit n'affiche que la **première image**. Placez toujours votre meilleure photo en position 1 lors de l'upload.

### Le poids impacte directement les frais de livraison du client
Renseignez le **poids en grammes** avec soin. Un poids trop élevé augmente les frais de livraison affichés au client, ce qui peut le dissuader d'acheter. Un poids manquant déclenche un tarif par défaut.

### Prix barré = conversion boostée
Renseignez toujours le **prix barré** si vous faites une promotion. L'affichage "~~5 000 FCFA~~ **3 500 FCFA**" est bien plus incitatif qu'un simple prix.

### Les spécifications sont indexées dans la recherche
Les spécifications produit (matière, garantie, dimensions…) apparaissent dans la page produit et améliorent la clarté. Complétez-les : les clients qui filtrent par attribut vous trouveront plus facilement.

### Utilisez les variantes plutôt que de créer plusieurs produits
Si vous vendez un article en plusieurs tailles ou couleurs, créez **un seul produit avec des variantes** — pas un produit par couleur. L'inventaire est géré par variante, et la page produit est plus claire pour l'acheteur.

### L'import CSV est idéal pour les catalogues > 20 produits
Téléchargez le modèle CSV, remplissez-le dans Excel ou Google Sheets, et importez en masse. Gain de temps énorme par rapport à la création manuelle.

### La description riche améliore le référencement et la conversion
Utilisez l'éditeur TipTap pour structurer votre description avec des **titres, listes à puces et images**. Une description de 300+ mots bien structurée convainc mieux qu'une ligne de texte brut.

---

## 3. Astuces vendeurs — Commandes et livraison

### Traitez les commandes en moins de 24h
Plus vous répondez vite (statut `processing`), plus vos avis clients seront positifs. Les acheteurs sont notifiés à chaque changement de statut — une réaction rapide est votre meilleure pub.

### Groupez vos livraisons en lots quotidiens
Plutôt que de créer un lot par commande, attendez d'avoir plusieurs commandes du jour et créez **un seul lot**. Le PDF récapitulatif à remettre au livreur est plus simple à gérer, et vous réduisez les frais logistiques.

### Le lot de livraison trie automatiquement par zone
Le système groupe les commandes par **zone géographique**. Si vos livraisons sont réparties sur plusieurs quartiers, créez plusieurs lots distincts — un par zone — pour optimiser les tournées.

### Exportez le PDF du lot pour votre livreur
Le PDF de lot contient le nom du client, son adresse et le montant COD à encaisser. Donnez-le directement à votre livreur pour éviter les erreurs. Pas besoin de recopier quoi que ce soit.

### Retours : approuvez vite, les délais comptent
Un retour non traité pénalise votre note vendeur. Dès réception d'une demande de retour, répondez dans les 48h — même pour refuser avec un motif clair.

---

## 4. Astuces vendeurs — Finances

### Le solde en attente est libéré automatiquement après 48h
Après confirmation de livraison, vos fonds passent de **"en attente"** à **"disponible"** sans action de votre part. Ne créez pas de ticket support pour demander la libération — c'est automatique.

### Vérifiez vos dettes de stockage avant un retrait
Si vous avez des factures de stockage impayées depuis plus de 30 jours, elles seront **déduites automatiquement** de votre prochain retrait. Consultez **Finances → Factures** avant de demander un retrait pour anticiper.

### Le montant minimum de retrait est de 655 XOF
En dessous de ce seuil, la demande sera refusée. Attendez d'avoir accumulé plus de fonds avant de déclencher un retrait.

### Activez la 2FA maintenant, pas au moment du retrait
La 2FA est **obligatoire** pour effectuer un retrait. Si vous ne l'avez pas encore activée, faites-le depuis **Paramètres → Sécurité** dès maintenant, avant d'en avoir besoin d'urgence.

### Le mode de paiement "différé" pour le stockage optimise votre trésorerie
Si vous avez des ventes régulières, choisissez le mode **différé** pour les factures de stockage — les frais sont déduits de vos prochains versements, sans impacter votre solde immédiat.

### Consultez le rapport Analytics avant de réapprovisionner
Avant de commander de nouveaux stocks, regardez vos métriques **Analytics** sur 30 ou 90 jours. Identifiez vos best-sellers par volume de commandes, pas seulement par chiffre d'affaires.

---

## 5. Astuces vendeurs — Visibilité et croissance

### Le Hero Banner a le meilleur ROI publicitaire
Parmi les espaces publicitaires disponibles (hero, banner, spotlight), le **Hero Banner** de la page d'accueil génère le plus d'impressions. Réservez-le pendant des périodes stratégiques (rentrée, fêtes, soldes).

### Réservez la pub tôt pour payer moins cher
Le prix des espaces publicitaires est dynamique — il monte avec la **demande**. Plus vous réservez tôt (plusieurs semaines à l'avance), plus le tarif est bas.

### Répondez aux avis négatifs professionnellement
Votre réponse aux avis négatifs est visible par tous les acheteurs potentiels. Une réponse calme et constructive montre votre sérieux et peut transformer une mauvaise impression en confiance.

### Utilisez les coupons pour les clients inactifs
Créez un coupon avec une contrainte "première commande" ou "minimum d'achat 5 000 FCFA" et partagez-le sur vos réseaux. Les coupons à durée limitée créent un sentiment d'urgence.

### Configurez le Meta Pixel pour mesurer vos campagnes Meta Ads
Si vous faites des publicités Facebook/Instagram, connectez votre **Meta Pixel** dans **Paramètres boutique → Meta Pixel**. Vous pouvez choisir exactement quels événements envoyer à Facebook (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase) via les toggles de la page. L'événement **Purchase** remonte via la Conversions API côté serveur — insensible aux bloqueurs de publicités. Le mini-dashboard de la même page vous montre le funnel de vos événements collectés sur la période de votre choix.

### Thème boutique : choisissez cohérent avec votre secteur
- **Modern / Default** — tech, électronique, accessoires.
- **Classic** — mode, bijoux, maison.
- **Royal** — luxe, cosmétiques premium.
- **Nature** — alimentation, produits naturels, jardinage.

### Complétez 100% de l'onboarding pour gagner en crédibilité
La barre d'onboarding sur le tableau de bord indique ce qui manque (logo, description, premier produit, etc.). Les boutiques complètes ont une meilleure position dans les listes de boutiques.

---

## 6. Astuces admins

### Validez les boutiques rapidement — les vendeurs attendent
Chaque boutique en attente de vérification est un vendeur qui ne peut pas encore vendre. Consultez la file d'attente **Admin → Boutiques** quotidiennement.

### Le journal d'audit trace toutes les modifications de config
Toute modification dans **Admin → Configuration** génère un événement dans `platform_events`. En cas de comportement inattendu de la plateforme, consultez ce journal en premier.

### Les tarifs de livraison impactent directement la conversion
Des frais de livraison trop élevés font abandonner les paniers. Ajustez les **tranches de distance** dans **Admin → Tarifs livraison** régulièrement en fonction des retours vendeurs et clients.

### Surveillez les retraits bloqués par les dettes de stockage
Un vendeur dont le retrait est systématiquement déduit de dettes de stockage risque de se décourager. Vérifiez les dettes récurrentes et proposez un plan de règlement si nécessaire.

### Utilisez les rôles granulaires pour déléguer
Plutôt que de créer des comptes admin généraux, utilisez les rôles spécifiques :
- `finance` — gestion des retraits uniquement.
- `logistics` — gestion des livraisons et stockage.
- `marketing` — gestion des publicités et catégories.
- `agent` — réception entrepôt uniquement.

---

## 7. Astuces techniques / power users

### Les sessions durent 2 jours — pensez à vous reconnecter
La session expire après **2 jours** d'inactivité. Sur un appareil partagé, déconnectez-vous manuellement depuis **Paramètres → Sécurité**.

### Les notifications push par appareil
Les notifications push sont abonnées **par appareil et par navigateur**. Si vous changez de navigateur ou réinstallez, rendez-vous dans **Paramètres → Notifications** et réactivez la subscription.

### Le checkout permet de modifier l'adresse jusqu'à l'étape 3
Vous pouvez revenir à l'étape 1 (adresse) depuis le bouton "Précédent" du stepper, même après avoir calculé les frais de livraison — le recalcul est automatique.

### La carte Leaflet fonctionne sans connexion au GPS
La carte de sélection d'adresse est indépendante du GPS de votre appareil. Vous pouvez placer manuellement le marqueur en naviguant sur la carte, sans activer la géolocalisation.

### Les retraits nécessitent 2FA — ne perdez pas vos codes de récupération
Si vous perdez l'accès à votre app authenticator, vous ne pourrez plus effectuer de retrait. Sauvegardez vos **codes de récupération 2FA** lors de l'activation dans un endroit sûr.

### Rechargez les notifications push après une mise à jour du navigateur
Les Service Workers peuvent être invalidés lors de mises à jour majeures du navigateur. Si vous ne recevez plus les notifications push, allez dans **Paramètres → Notifications**, désactivez puis réactivez la subscription.

---

## Récapitulatif des limites clés à connaître

| Fonctionnalité | Limite |
|----------------|--------|
| Retrait minimum | 655 XOF |
| Libération du solde après livraison | 48 heures |
| Expiration des commandes non payées | 2 heures |
| Durée d'une session | 2 jours |
| Tentatives de connexion avant blocage | 5 tentatives / 15 min |
| Durée du blocage après 5 échecs | 30 minutes |
| Validité d'un lien de réinitialisation de mot de passe | 30 minutes |
| Niveaux de catégories | 2 niveaux max |
| Devise principale | XOF (Franc CFA) |
| Pays supportés pour la livraison | Bénin (zone principale) |

---

*Document généré le 04/04/2026 — Pixel-Mart v1.0*
