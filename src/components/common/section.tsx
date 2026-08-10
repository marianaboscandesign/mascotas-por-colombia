import * as React from "react";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Si es true, no envuelve el contenido en un Container. */
  bleed?: boolean;
  containerClassName?: string;
}

/** Sección vertical con espaciado consistente y contenedor central. */
export function Section({
  className,
  containerClassName,
  bleed = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-16 sm:py-20 lg:py-24", className)} {...props}>
      {bleed ? (
        children
      ) : (
        <Container className={containerClassName}>{children}</Container>
      )}
    </section>
  );
}
