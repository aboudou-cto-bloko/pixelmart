"use client";

import { useActionState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { verifyAccessCode } from "./actions";

export function AccessForm({ from }: { from: string }) {
  const [state, action, isPending] = useActionState(verifyAccessCode, null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state?.error) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [state]);

  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-12"
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-xl shadow-black/40">
          <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>

          <h1 className="mb-1 text-lg font-bold text-foreground">
            Accès restreint
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Entrez le code d&apos;accès pour continuer.
          </p>

          <form action={action} className="space-y-4">
            <input type="hidden" name="from" value={from} />

            <div className="space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state?.error ? "error" : "idle"}
                  animate={state?.error ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <input
                    ref={inputRef}
                    type="password"
                    name="code"
                    placeholder="••••••••••••"
                    autoComplete="off"
                    disabled={isPending}
                    className={`w-full rounded-xl border bg-background/60 px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${
                      state?.error
                        ? "border-destructive/60 focus:ring-destructive/30"
                        : "border-border/50 focus:border-primary/40"
                    }`}
                  />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {state?.error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-destructive"
                  >
                    {state.error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Accéder</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/30">
          Pixel-Mart · Accès développeur
        </p>
      </motion.div>
    </div>
  );
}
