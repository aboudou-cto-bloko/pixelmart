// filepath: src/hooks/useOnboardingProgress.ts

import { useQuery } from "convex/react";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../convex/_generated/api";

const DISMISS_KEY_PREFIX = "pm_setup_guide_dismissed_";

/**
 * Hook exposant l'état d'avancement de la configuration boutique.
 * Le guide peut être masqué via localStorage (par boutique).
 * Il réapparaît automatiquement si toutes les étapes sont complètes.
 */
export function useOnboardingProgress() {
  const progress = useQuery(api.stores.queries.getOnboardingProgress);
  const [dismissed, setDismissed] = useState(false);

  // Lire l'état de dismiss depuis localStorage une fois le storeId disponible
  useEffect(() => {
    if (!progress?.storeId) return;
    const key = `${DISMISS_KEY_PREFIX}${progress.storeId}`;
    setDismissed(localStorage.getItem(key) === "true");
  }, [progress?.storeId]);

  const dismiss = useCallback(() => {
    if (!progress?.storeId) return;
    const key = `${DISMISS_KEY_PREFIX}${progress.storeId}`;
    localStorage.setItem(key, "true");
    setDismissed(true);
  }, [progress?.storeId]);

  const isVisible =
    progress !== undefined &&
    !progress.isComplete &&
    !dismissed;

  return {
    progress,
    isLoading: progress === undefined,
    isVisible,
    dismiss,
  };
}
