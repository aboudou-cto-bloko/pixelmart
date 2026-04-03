# CONTRIBUTING — Pixel-Mart

> Ce document est **obligatoire** avant d'écrire la moindre ligne de code.
> Il décrit le contrat de collaboration sur ce projet.

---

## 1. Philosophie du projet

Pixel-Mart est construit pour durer. Chaque décision technique favorise :

- **La lisibilité** sur la concision — le code est lu 10× plus qu'il n'est écrit
- **La maintenabilité** sur la vitesse — le code rapide mais cassant est une dette
- **La cohérence** sur la préférence personnelle — les conventions valent plus que les opinions
- **La simplicité** sur la sophistication — la solution la plus simple qui fonctionne est la bonne

---

## 2. Pré-requis avant de contribuer

### Environnement

```bash
node --version   # >= 18.0.0
pnpm --version   # >= 8.0.0
git --version    # >= 2.40.0
```

### Setup initial

```bash
git clone git@github.com:aboudou-cto-bloko/pixelmart.git
cd pixelmart
pnpm install          # installe les dépendances + active les hooks Husky
cp .env.example .env.local  # remplir les variables manquantes
npx convex dev        # démarre le backend Convex (terminal dédié)
pnpm dev              # démarre Next.js
```

> **Important :** `pnpm install` active automatiquement Husky via le script `prepare`.
> Sans cette étape, les hooks git ne fonctionnent pas.

### Vérifier que tout est en ordre

```bash
pnpm validate   # lint + type-check + format:check
```

Tout doit passer à **0 erreur** avant de commencer à travailler.

---

## 3. Workflow de contribution

### Règle d'or : `main` est toujours déployable

Ne jamais pousser du code cassé sur `main`. Jamais.

### Flux standard

```
1. Partir de main à jour
   git checkout main && git pull origin main

2. Créer une branche courte (max 3 jours de travail)
   git checkout -b feat/products-csv-import

3. Coder + commiter fréquemment (voir §4 Commits)

4. Rebaser sur main avant de pousser
   git rebase main

5. Pousser + ouvrir une PR
   git push origin feat/products-csv-import

6. Remplir le template PR (voir §6 Pull Requests)

7. Attendre que le CI passe (lint + typecheck + tests + build)

8. Squash merge → supprimer la branche
```

### Nommage des branches

```
feat/nom-descriptif-court
fix/nom-du-bug
hotfix/urgence-production
schema/nom-du-changement
ui/nom-du-composant
refactor/nom-du-module
```

### Durée maximale d'une branche : 3 jours

Si une tâche prend plus de 3 jours, elle est trop grande. Découper en sous-tâches.

---

## 4. Convention des commits

Format strict — le hook `commit-msg` rejette tout commit non conforme.

```
type(scope): description courte

[corps optionnel — POURQUOI, pas QUOI]

[footer optionnel — breaking changes, refs issues]
```

### Types autorisés

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité visible par l'utilisateur |
| `fix` | Correction de bug |
| `refactor` | Restructuration sans changement de comportement |
| `ui` | Changements de style ou d'interface |
| `schema` | Modification du schéma Convex |
| `api` | Changement d'une route API |
| `config` | Configuration, dépendances, variables d'env |
| `docs` | Documentation uniquement |
| `test` | Ajout ou modification de tests |
| `chore` | Maintenance, scripts, tooling |
| `perf` | Optimisation de performance |

### Scopes autorisés

```
auth · users · stores · products · orders · payments · transactions
payouts · reviews · coupons · messages · notifications · categories
dashboard · storefront · checkout · analytics · admin · ai · ads
themes · deps · ci · storage · agent · emails · variants
```

### Règles

- Le **scope est obligatoire** — le hook rejette les commits sans scope
- La **description est en minuscules** — sauf acronymes (ESLint, XOF, PR, API)
- **Pas de point final** sur le sujet
- **Longueur max du header** : 100 caractères
- Le **corps commence par une ligne vide** après le sujet

### Exemples valides

```bash
feat(products): add CSV bulk import with validation and error report
fix(payments): handle Moneroo webhook timeout with retry logic
schema(orders): add tracking_url field to orders table
ui(dashboard): implement stat cards with trend indicators
config(ci): add pre-push typecheck hook
refactor(auth): extract token validation into dedicated helper
```

### Exemples invalides

```bash
# ❌ Pas de scope
feat: add product form

# ❌ Type non reconnu
update(products): change product form

# ❌ Scope non reconnu
feat(product-management): add form

# ❌ Description vide
fix(auth):

# ❌ Header trop long (> 100 chars)
feat(products): add a very long description that exceeds the maximum allowed length for a commit header
```

---

## 5. Les gates automatiques

Chaque commit passe par des guards automatiques. Voici ce qui se passe :

```
git commit
  → pre-commit  : lint-staged (ESLint + Prettier sur les fichiers stagés)
  → commit-msg  : commitlint (format du message)

git push
  → pre-push    : tsc --noEmit (TypeScript strict)

Pull Request → main
  → CI: lint          (ESLint sur tout le projet)
  → CI: format:check  (Prettier sur tout le projet)
  → CI: type-check    (TypeScript strict)
  → CI: test          (Vitest)
  → CI: build         (Next.js build)
  → CI: commitlint    (titre de la PR = commit squash)
```

**Si un gate échoue :** corriger avant de continuer. Ne jamais contourner avec `--no-verify`.

> `--no-verify` est réservé aux WIP commits locaux uniquement.
> Tout commit destiné à être pushé DOIT passer les gates.

---

## 6. Pull Requests

### Titre de la PR = message du commit squash

Le CI valide le titre de la PR avec commitlint. Utilise le même format :

```
feat(products): add CSV bulk import with validation
```

### Remplir le template obligatoirement

Le template `.github/pull_request_template.md` s'affiche automatiquement.
Toutes les cases de la checklist doivent être cochées avant de demander une review.

### Checklist avant merge

- [ ] `pnpm validate` passe à 0 erreur en local
- [ ] Testé manuellement (happy path + cas limites)
- [ ] Mobile testé si changement UI
- [ ] Aucun `console.log` de debug
- [ ] Aucun `TODO` non documenté avec une issue
- [ ] Aucune donnée sensible dans le code (clés API, mots de passe)
- [ ] PR fait une seule chose (pas de "while I was there")

### Règles de review

- Une PR = une feature ou un fix. Pas les deux.
- Screenshots obligatoires pour tout changement UI (avant/après)
- Les commentaires de review sont des demandes, pas des ordres. Discuter si désaccord.

---

## 7. Ce qu'il ne faut JAMAIS faire

```
❌ Push direct sur main
❌ Appeler une API externe dans une mutation Convex
❌ Stocker des données sensibles côté client
❌ Utiliser le type `any` TypeScript
❌ Hard-coder des credentials ou des URLs
❌ Créer du CSS custom quand Tailwind suffit
❌ Construire un composant UI que shadcn/ui fournit déjà
❌ Stocker des montants en float (toujours en centimes)
❌ Modifier une transaction existante (elles sont immuables)
❌ Sauter la validation des inputs sur des opérations financières
❌ Utiliser --no-verify sur un commit destiné à être mergé
```

---

## 8. Phases du projet — ne pas dépasser le scope

| Phase | Statut | Contenu |
|-------|--------|---------|
| **Phase 0** | ✅ Complète | Catalogue, commandes, paiements, dashboard vendeur |
| **Phase 1** | 🔄 En cours | Analytics, ads, thèmes, reviews, notifications, variantes, stockage, checkout invité, sécurité |
| Phase 2 | ⏳ Planifiée | Couche IA |
| Phase 3+ | ⏳ Planifiée | Features avancées |

**Si une tâche appartient à une phase future :** ouvrir une issue avec le label `future-phase` et ne pas coder. La vitesse de développement dépend de la concentration sur la phase active.

---

## 9. Questions et aide

- Problème technique → chercher d'abord dans la doc Convex, Next.js, shadcn/ui
- Bug ou comportement inattendu → ouvrir une issue avec le template "Bug Report"
- Nouvelle feature → ouvrir une issue avec le template "Feature Request" avant de coder
- Changement de schéma → ouvrir une issue "Schema Change" et discuter l'impact

---

*Dernière mise à jour : Phase 1 active*
