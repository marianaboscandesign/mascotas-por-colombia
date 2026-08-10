"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { deleteNews } from "@/app/admin/noticias/actions";
import { Button } from "@/components/ui/button";

export function DeleteNewsButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-destructive hover:text-destructive"
      onClick={() => {
        if (window.confirm("¿Eliminar esta noticia?")) {
          start(async () => {
            await deleteNews(id);
            router.refresh();
          });
        }
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      Eliminar
    </Button>
  );
}
