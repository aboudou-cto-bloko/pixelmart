"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/atoms/ErrorView";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ShopError]", error);
  }, [error]);

  return (
    <ErrorView
      error={error}
      reset={reset}
      backHref="/"
      backLabel="Retour à l'accueil"
    />
  );
}
