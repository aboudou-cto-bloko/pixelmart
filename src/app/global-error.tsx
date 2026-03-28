"use client";

import { useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

// global-error.tsx remplace le root layout entier — doit inclure <html> et <body>.
// Pas d'accès aux composants UI qui dépendent du layout (ThemeProvider, fonts).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError — layout crash]", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fff",
          color: "#09090b",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            maxWidth: 420,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertCircle style={{ width: 32, height: 32, color: "#dc2626" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
              Erreur critique
            </h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#71717a" }}>
              Une erreur inattendue a empêché le chargement de la page.
              <br />
              Veuillez réessayer.
            </p>
            {error.digest && (
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#a1a1aa", fontFamily: "monospace" }}>
                Réf. : {error.digest}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                background: "#09090b",
                color: "#fff",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Réessayer
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #e4e4e7",
                background: "#fff",
                color: "#09090b",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
