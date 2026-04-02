"use client";

import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Inner class component ────────────────────────────────────
// React error boundaries must be class components.
// This inner component receives `onError` as a prop so the
// outer functional component can inject the Convex mutation.

interface InnerProps {
  children: React.ReactNode;
  onError: (error: Error, info: React.ErrorInfo) => void;
}

interface InnerState {
  hasError: boolean;
}

class ErrorBoundaryInner extends React.Component<InnerProps, InnerState> {
  state: InnerState = { hasError: false };

  static getDerivedStateFromError(): InnerState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
          <AlertTriangle className="size-10 text-destructive opacity-70" />
          <div>
            <h2 className="text-lg font-semibold">
              Une erreur inattendue s&apos;est produite
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Notre équipe a été notifiée. Vous pouvez réessayer ou recharger la
              page.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false })}
            >
              Réessayer
            </Button>
            <Button onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Public wrapper ────────────────────────────────────────────
// Functional component that injects the Convex mutation via hook,
// then delegates to the class component for actual error catching.

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const logClientError = useMutation(api.admin.mutations.logClientError);

  const handleError = React.useCallback(
    (error: Error, info: React.ErrorInfo) => {
      logClientError({
        message: error.message.slice(0, 500),
        stack: error.stack?.slice(0, 2000),
        componentStack: info.componentStack?.slice(0, 2000) ?? undefined,
        url:
          typeof window !== "undefined" ? window.location.pathname : undefined,
      }).catch(() => {});
    },
    [logClientError],
  );

  return (
    <ErrorBoundaryInner onError={handleError}>{children}</ErrorBoundaryInner>
  );
}
