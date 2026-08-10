import { Construction } from "lucide-react";

import { Section } from "@/components/common/section";

/**
 * Bloque temporal para rutas cuya funcionalidad se construirá más adelante.
 * Mantiene una presencia visual cuidada mientras se desarrolla la sección.
 */
export function ComingSoon({ note }: { note?: string }) {
  return (
    <Section>
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
          <Construction className="size-6" aria-hidden="true" />
        </span>
        <h2 className="font-heading mt-6 text-xl font-semibold">
          En construcción
        </h2>
        <p className="text-muted-foreground mt-2">
          {note ??
            "Esta sección estará disponible muy pronto. Estamos preparándola con cuidado."}
        </p>
      </div>
    </Section>
  );
}
