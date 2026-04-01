"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

// 1er avril 2026 à 16h00 heure de Cotonou (UTC+1)
const LAUNCH_AT = new Date("2026-04-01T15:00:00.000Z").getTime();

function getTimeLeft() {
  const diff = LAUNCH_AT - Date.now();
  if (diff <= 0) return null;
  return {
    jours: Math.floor(diff / (1000 * 60 * 60 * 24)),
    heures: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    secondes: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-lg shadow-black/30">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="font-mono text-2xl sm:text-3xl font-bold text-foreground tabular-nums"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground/50 font-medium">
        {label}
      </span>
    </div>
  );
}

export function CountdownPage() {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    // Initialisation côté client uniquement (évite mismatch SSR)
    const initial = getTimeLeft();
    if (!initial) {
      setLaunched(true);
      window.location.replace("/");
      return;
    }
    setTimeLeft(initial);

    const interval = setInterval(() => {
      const left = getTimeLeft();
      if (!left) {
        clearInterval(interval);
        setLaunched(true);
        window.location.replace("/");
        return;
      }
      setTimeLeft(left);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Glow d'arrière-plan */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[120px]" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-14"
      >
        <Image
          src="/Pixel-Mart.png"
          alt="Pixel-Mart"
          width={120}
          height={40}
          className="h-10 w-auto"
          priority
        />
      </motion.div>

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center text-center"
      >
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-primary/70 font-semibold">
          Lancement imminent
        </p>
        <h1 className="mb-2 text-3xl sm:text-4xl font-bold text-foreground">
          Pixel-Mart arrive
        </h1>
        <p className="mb-10 text-sm text-muted-foreground/60 max-w-xs">
          La marketplace pensée pour le Bénin ouvre ses portes le&nbsp;
          <span className="text-foreground/80 font-medium">
            1er avril à 16h
          </span>
          .
        </p>

        {/* Countdown */}
        {!launched && timeLeft ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-end gap-3 sm:gap-4"
          >
            {timeLeft.jours > 0 && (
              <>
                <CountdownUnit value={pad(timeLeft.jours)} label="Jours" />
                <span className="mb-8 text-2xl font-light text-muted-foreground/30">:</span>
              </>
            )}
            <CountdownUnit value={pad(timeLeft.heures)} label="Heures" />
            <span className="mb-8 text-2xl font-light text-muted-foreground/30">:</span>
            <CountdownUnit value={pad(timeLeft.minutes)} label="Minutes" />
            <span className="mb-8 text-2xl font-light text-muted-foreground/30">:</span>
            <CountdownUnit value={pad(timeLeft.secondes)} label="Secondes" />
          </motion.div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground/50"
          >
            Redirection en cours…
          </motion.p>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-8 text-xs text-muted-foreground/20"
      >
        pixel-mart-bj.com
      </motion.p>
    </div>
  );
}
