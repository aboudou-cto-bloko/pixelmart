# Pixel-Mart Vendor Promo — Remotion

Vidéo promotionnelle 9:16 (45s) pour convaincre Kofi d'ouvrir sa boutique sur Pixel-Mart.
Toutes les animations respectent les 12 principes Disney. Aucun asset externe — tout en CSS/SVG inline.

## Prérequis

- Node.js 18+
- pnpm

## Installation

```bash
cd remotion-promo
pnpm install
```

## Lancer le studio Remotion (preview interactif)

```bash
pnpm start
```

Ouvre `http://localhost:3000`. Dans la sidebar, tu trouveras :
- **MainComposition** — la vidéo complète (45s, 1350 frames)
- **Scenes/** — chaque scène isolée pour développement rapide

## Rendre une scène isolée

```bash
pnpm render:scene1   # Intro (0–2s)
pnpm render:scene2   # Création boutique (2–6s)
pnpm render:scene3   # Ajout produit (6–14s)
pnpm render:scene4   # Commande reçue (14–22s)
pnpm render:scene5   # Livraison (22–30s)
pnpm render:scene6   # Dashboard (30–38s)
pnpm render:scene7   # Outro/CTA (38–45s)
```

Les fichiers sont exportés dans `out/`.

## Exporter le MP4 final

```bash
pnpm build
```

Produit `out/pixel-mart-promo.mp4` — H.264, CRF 18 (qualité élevée), 1080×1920.

## Structure

```
src/
├── index.ts                   # registerRoot
├── Root.tsx                   # Toutes les Composition déclarées
├── config.ts                  # Constantes timing, springs, couleurs
├── compositions/
│   ├── MainComposition.tsx    # Vidéo complète (7 Sequences)
│   └── scenes/
│       ├── Scene1Intro.tsx    # Logo + typewriter
│       ├── Scene2CreateStore.tsx
│       ├── Scene3AddProduct.tsx  # 5 cuts internes
│       ├── Scene4Order.tsx       # 3 cuts internes
│       ├── Scene5Delivery.tsx    # 3 cuts internes
│       ├── Scene6Dashboard.tsx   # 4 cuts internes
│       └── Scene7Outro.tsx
└── components/
    ├── GlassCard.tsx          # Verre liquide + Shine + Halo
    ├── TypewriterText.tsx     # Squash & stretch par caractère
    ├── ParticleSystem.tsx     # 32 particules physique réelle
    ├── SuccessBadge.tsx       # Spring 420, coche stroke-dashoffset
    ├── AnimatedCounter.tsx    # easeOutCubic + squash aux milliers
    ├── MapMockup.tsx          # SVG carte Cotonou Bézier animé
    ├── Sparkline.tsx          # Courbe SVG + fill dégradé orange
    └── FloatingOrbs.tsx       # 45 orbes sinusoïdaux
```

## Timing de référence (95 BPM → 30 fps)

| Unité | Frames |
|---|---|
| 1 beat | 19 |
| 1 mesure (4 beats) | 76 |
| 1 seconde | 30 |

## Modifier les données

Éditer `mock-data.json` à la racine pour changer les valeurs affichées.

## Vérification TypeScript

```bash
pnpm typecheck
```
