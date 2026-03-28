"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/atoms/ErrorView";

export default function VendorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isUnauth =
      error.message === "Unauthenticated" ||
      error.message?.includes("Unauthenticated");
    if (!isUnauth) console.error("[VendorError]", error);
  }, [error]);

  return (
    <ErrorView
      error={error}
      reset={reset}
      backHref="/vendor/dashboard"
      backLabel="Dashboard vendeur"
    />
  );
}
