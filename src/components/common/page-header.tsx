import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
}

/** Encabezado estándar para páginas internas: contexto, título y bajada. */
export function PageHeader({
  title,
  description,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("border-border bg-muted/30 border-b", className)}>
      <Container className="py-12 lg:py-16">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-primary mb-2 text-sm font-semibold tracking-wide uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
