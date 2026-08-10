"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, Map, Menu, Plus, Search, X } from "lucide-react";

import { ctaNav, routes } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

interface Tab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
}

/** Pestañas a la izquierda y derecha del botón central de reporte. */
const LEFT_TABS: Tab[] = [
  {
    label: "Inicio",
    href: routes.home,
    icon: Home,
    isActive: (p) => p === "/",
  },
  {
    label: "Buscar",
    href: routes.search,
    icon: Search,
    isActive: (p) => p.startsWith("/buscar"),
  },
];

const RIGHT_TABS: Tab[] = [
  {
    label: "Mapa",
    href: routes.map,
    icon: Map,
    isActive: (p) => p.startsWith("/mapa"),
  },
];

/**
 * Barra de navegación inferior para móvil/tablet (oculta en escritorio `xl`).
 * Acceso rápido a Inicio, Buscar, Mapa y al menú completo, con un botón central
 * destacado para reportar una mascota. El header superior conserva la marca.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  return (
    <>
      <nav
        aria-label="Navegación rápida"
        className="border-border/80 bg-background/90 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {LEFT_TABS.map((tab) => (
            <TabLink key={tab.href} tab={tab} active={tab.isActive(pathname)} />
          ))}

          {/* Botón central de reporte */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              aria-label="Reportar una mascota"
              className="bg-warm text-warm-foreground -mt-7 flex size-14 items-center justify-center rounded-full shadow-lg ring-4 ring-[var(--background)] transition-transform active:scale-95"
            >
              <Plus className="size-7" />
            </button>
          </div>

          {RIGHT_TABS.map((tab) => (
            <TabLink key={tab.href} tab={tab} active={tab.isActive(pathname)} />
          ))}

          {/* Menú completo */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="text-muted-foreground hover:text-foreground flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
          >
            <Menu className="size-5" aria-hidden="true" />
            Menú
          </button>
        </div>
      </nav>

      {/* Panel lateral con la navegación completa */}
      <MobileNav open={menuOpen} onOpenChange={setMenuOpen} />

      {/* Hoja inferior para elegir tipo de reporte */}
      <Dialog.Root open={reportOpen} onOpenChange={setReportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-foreground/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-sm" />
          <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 rounded-t-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl">
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-heading text-lg font-semibold">
                ¿Qué quieres reportar?
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Cerrar">
                  <X />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="text-muted-foreground text-sm">
              Elige una opción para empezar el reporte.
            </Dialog.Description>
            <Button
              asChild
              variant="warm"
              size="lg"
              onClick={() => setReportOpen(false)}
            >
              <Link href={ctaNav.reportLost.href}>
                Reportar mascota perdida
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              onClick={() => setReportOpen(false)}
            >
              <Link href={ctaNav.reportFound.href}>
                Reportar mascota encontrada
              </Link>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      {tab.label}
    </Link>
  );
}
