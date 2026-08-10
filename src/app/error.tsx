"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { routes } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log para observabilidad (Vercel captura console.error en el servidor).
    console.error("Error en la aplicación:", error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="bg-destructive/10 text-destructive grid size-14 place-items-center rounded-2xl">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Algo salió mal</h1>
      <p className="text-muted-foreground mt-4 max-w-md">
        Ocurrió un error inesperado. Puedes intentar de nuevo; si el problema
        continúa, vuelve más tarde.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">
          Intentar de nuevo
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={routes.home}>Ir al inicio</Link>
        </Button>
      </div>
    </Container>
  );
}
