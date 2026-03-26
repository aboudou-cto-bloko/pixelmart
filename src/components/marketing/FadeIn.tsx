"use client";

// filepath: src/components/marketing/FadeIn.tsx
// Animation wrappers scroll-driven — motion.dev.
// once: true par défaut → chaque élément s'anime une seule fois, pas de re-trigger au re-scroll.

import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Offsets réduits pour éviter les débordements sur mobile et fluidifier le défilement
const Y_OFFSET = 20;
const X_OFFSET = 20;

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  once?: boolean;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.5,
  once = true,
}: FadeInProps) {
  const yOffset =
    direction === "up" ? Y_OFFSET : direction === "down" ? -Y_OFFSET : 0;
  const xOffset =
    direction === "left" ? X_OFFSET : direction === "right" ? -X_OFFSET : 0;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export function Stagger({
  children,
  className,
  staggerDelay = 0.08,
  once = true,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Reveal par clip-path — effet "rideau" pour les titres de section. */
export function RevealText({
  children,
  className,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        initial={{ y: "105%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once, margin: "-60px" }}
        transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
