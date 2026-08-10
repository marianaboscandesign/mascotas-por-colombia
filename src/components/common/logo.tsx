import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { routes } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Oculta el texto y muestra solo el ícono (útil en móvil). */
  iconOnly?: boolean;
}

/**
 * Marca de "Mascotas por Colombia": el mapa de Colombia con un perro,
 * un gato y un corazón. La imagen vive en /public/logo.png.
 */
export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <Link
      href={routes.home}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md",
        className,
      )}
      aria-label={`${siteConfig.name} — inicio`}
    >
      {/* Versión a color (modo claro) y versión blanca (modo oscuro). */}
      <Image
        src="/logo.webp"
        alt=""
        width={44}
        height={44}
        priority
        className="size-10 shrink-0 object-contain transition-transform group-hover:scale-105 dark:hidden"
      />
      <Image
        src="/logo-white.webp"
        alt=""
        width={44}
        height={44}
        priority
        className="hidden size-10 shrink-0 object-contain transition-transform group-hover:scale-105 dark:block"
      />
      {!iconOnly && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-foreground text-base font-bold tracking-tight">
            Mascotas
          </span>
          <span className="text-muted-foreground text-xs font-medium">
            por Colombia
          </span>
        </span>
      )}
    </Link>
  );
}
