"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type ActionResult } from "@/types";

/**
 * Botón de borrado reutilizable para el panel admin. Recibe una server action
 * ya enlazada al id (p. ej. deleteFreeVet.bind(null, id)). Pide confirmación.
 */
export function DeleteButton({
  action,
  confirmText = "¿Eliminar este elemento? No se puede deshacer.",
  label = "Eliminar",
}: {
  action: () => Promise<ActionResult>;
  confirmText?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function onClick() {
    if (!window.confirm(confirmText)) return;
    start(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="text-destructive hover:text-destructive"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {label}
    </Button>
  );
}
