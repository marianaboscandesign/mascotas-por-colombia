"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAutofillCardProps {
  onClick: () => void;
  entityName?: string; // e.g. "mascota", "veterinario", "refugio", "voluntario"
}

export function AiAutofillCard({ onClick, entityName = "mascota" }: AiAutofillCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/40 to-amber-100/10 p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/10 dark:to-amber-950/5 mb-8">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 size-24 bg-amber-400/5 rounded-full blur-xl pointer-events-none" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="font-heading text-base font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500 animate-pulse" />
            ¿Tienes fotos o una publicación de X?
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sube fotos de la {entityName} reportada o pega un enlace de X (Twitter). Nuestra IA completará el formulario automáticamente con la información que pueda identificar.
          </p>
        </div>
        <div className="shrink-0 md:self-center">
          <Button
            type="button"
            onClick={onClick}
            variant="warm"
            className="w-full md:w-auto relative overflow-hidden group shadow-md shadow-amber-500/10 border-amber-300/30 font-medium"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-amber-400/20 to-amber-200/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <Sparkles className="size-4 mr-2" />
            Autocompletar con IA
          </Button>
        </div>
      </div>
    </div>
  );
}
