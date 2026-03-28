"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/atoms/ErrorView";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <ErrorView
      error={error}
      reset={reset}
      backHref="/admin/dashboard"
      backLabel="Dashboard admin"
    />
  );
}
