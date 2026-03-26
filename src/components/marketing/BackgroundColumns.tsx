"use client";

// filepath: src/components/marketing/BackgroundColumns.tsx
// Fond animé : colonnes de texte subliminal qui défilent du bas vers le haut.
// position: fixed, z-0, pointer-events: none. Opacity très basse (< 6%).

import { motion } from "motion/react";

const COLUMNS = [
  {
    words: ["VENDEZ.", "BOUTIQUE.", "CLIENTS.", "REVENUS.", "STOCK."],
    duration: 38,
    /** Phase de départ en % pour décaler chaque colonne visuellement dès le 1er frame */
    phaseOffset: 0,
    opacity: 0.045,
  },
  {
    words: ["GRANDISSEZ.", "COTONOU.", "COMMANDES.", "LIVRAISON."],
    duration: 56,
    phaseOffset: -18,
    opacity: 0.038,
  },
  {
    words: ["ENCAISSEZ.", "MOBILE MONEY.", "BOUTIQUE.", "BÉNIN."],
    duration: 44,
    phaseOffset: -35,
    opacity: 0.052,
  },
  {
    words: [
      "LANCEZ-VOUS.",
      "VENDEZ.",
      "GRANDISSEZ.",
      "CLIENTS.",
      "CROISSANCE.",
    ],
    duration: 63,
    phaseOffset: -10,
    opacity: 0.034,
  },
  {
    words: ["BOUTIQUE.", "ENCAISSEZ.", "REVENUS.", "COTONOU.", "BÉNIN."],
    duration: 48,
    phaseOffset: -28,
    opacity: 0.042,
  },
  {
    words: ["VENDEZ.", "MOBILE MONEY.", "LANCEZ-VOUS.", "STOCK.", "COMMANDES."],
    duration: 71,
    phaseOffset: -8,
    opacity: 0.031,
  },
];

// Répète le tableau de mots pour couvrir plusieurs fois la hauteur d'écran.
// La duplication finale assure le loop sans couture : on anime de start à start - 50%.
function buildWordList(words: string[], reps = 8): string[] {
  const base = Array.from({ length: reps }, () => words).flat();
  return [...base, ...base]; // doublé → loop sans couture à -50%
}

interface ColumnProps {
  words: string[];
  duration: number;
  phaseOffset: number; // % entre 0 et -50
  opacity: number;
}

function ScrollColumn({ words, duration, phaseOffset, opacity }: ColumnProps) {
  const list = buildWordList(words);

  // La colonne part à `phaseOffset`% et arrive à `phaseOffset - 50`%,
  // soit exactement une "demi-liste" de défilement → loop sans couture.
  const fromY = `${phaseOffset}%`;
  const toY = `${phaseOffset - 50}%`;

  return (
    <div className="relative flex-1 overflow-hidden" aria-hidden="true">
      <motion.div
        className="flex flex-col"
        style={{ opacity }}
        animate={{ y: [fromY, toY] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          // Pas de delay ni d'easings intermédiaires : flux continu
        }}
      >
        {list.map((word, i) => (
          <div key={i} className="py-3.5 text-center">
            <span
              className="select-none whitespace-nowrap font-heading font-black uppercase leading-none tracking-tighter text-foreground"
              style={{ fontSize: "clamp(0.9rem, 1.8vw, 1.6rem)" }}
            >
              {word}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function BackgroundColumns() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex overflow-hidden"
      aria-hidden="true"
    >
      {COLUMNS.map((col, i) => (
        <ScrollColumn key={i} {...col} />
      ))}
    </div>
  );
}
