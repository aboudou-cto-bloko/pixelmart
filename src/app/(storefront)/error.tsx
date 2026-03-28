"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/atoms/ErrorView";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[StorefrontError]", error);
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
