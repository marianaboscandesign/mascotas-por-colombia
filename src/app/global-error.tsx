"use client";

import * as React from "react";

// Captura errores que ocurren en el propio layout raíz. Debe incluir <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Error crítico:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          color: "#1f2937",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Algo salió mal</h1>
        <p style={{ color: "#6b7280", maxWidth: "28rem" }}>
          Ocurrió un error inesperado. Intenta recargar la página.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#46756c",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.625rem 1.25rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  );
}
