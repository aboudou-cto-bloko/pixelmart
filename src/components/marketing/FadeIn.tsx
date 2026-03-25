"use client";

// filepath: src/components/marketing/FadeIn.tsx
// Animation wrappers scroll-driven — motion.dev.
// viewport: once:false → chaque section se réanime à chaque passage (scroll storytelling).

import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  /** Si true, ne s'anime qu'une seule fois (pratique pour hero / éléments statiques) */
  once?: boolean;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.55,
  once = false,
}: FadeInProps) {
  const yOffset = direction === "up" ? 32 : direction === "down" ? -32 : 0;
  const xOffset = direction === "left" ? 32 : direction === "right" ? -32 : 0;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: "-80px" }}
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
  staggerDelay = 0.09,
  once = false,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
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
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE },
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
  once = false,
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
        transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
