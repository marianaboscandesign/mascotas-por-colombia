import { Loader2 } from "lucide-react";

import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-20">
      <span className="sr-only">Cargando…</span>
      <Loader2
        className="text-muted-foreground size-8 animate-spin"
        aria-hidden="true"
      />
    </Container>
  );
}
