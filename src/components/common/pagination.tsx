import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Parámetros de búsqueda actuales (sin `page`). */
  baseParams: Record<string, string>;
  basePath?: string;
}

/** Genera una ventana de páginas alrededor de la actual. */
function pageWindow(page: number, total: number): number[] {
  const span = 1;
  const pages = new Set<number>([1, total, page]);
  for (let i = page - span; i <= page + span; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  return [...pages].sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  baseParams,
  basePath = "/buscar",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(baseParams);
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const windowed = pageWindow(page, totalPages);

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1.5"
      aria-label="Paginación"
    >
      <PageLink
        href={hrefFor(page - 1)}
        disabled={page <= 1}
        ariaLabel="Página anterior"
      >
        <ChevronLeft className="size-4" />
      </PageLink>

      {windowed.map((p, i) => {
        const prev = windowed[i - 1];
        const gap = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="text-muted-foreground px-1">…</span>}
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: p === page ? "default" : "outline",
                  size: "icon",
                }),
                "size-9",
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}

      <PageLink
        href={hrefFor(page + 1)}
        disabled={page >= totalPages}
        ariaLabel="Página siguiente"
      >
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "pointer-events-none size-9 opacity-50",
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "size-9",
      )}
    >
      {children}
    </Link>
  );
}
