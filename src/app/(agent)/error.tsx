"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/atoms/ErrorView";

export default function AgentError({
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
    if (!isUnauth) console.error("[AgentError]", error);
  }, [error]);

  return (
    <ErrorView
      error={error}
      reset={reset}
      backHref="/agent"
      backLabel="Interface agent"
    />
  );
}
