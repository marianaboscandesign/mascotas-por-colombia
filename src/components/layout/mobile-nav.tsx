"use client";

import * as React from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { ctaNav, helpNav, mainNav, routes } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/layout/nav-link";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Panel lateral de navegación para móvil/tablet (Radix Dialog gestiona foco,
 * Escape y aria). Es un componente controlado: el estado de apertura lo maneja
 * quien lo monta (hoy, la barra inferior `MobileTabBar`).
 */
export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-foreground/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col gap-6 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-heading text-lg font-semibold">
              Navegación
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar menú">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Enlaces principales de Mascotas por Colombia.
          </Dialog.Description>

          <nav className="flex flex-col gap-1" aria-label="Principal">
            <NavLink
              href={routes.search}
              onNavigate={close}
              className="hover:bg-secondary rounded-lg px-3 py-2.5 text-base"
            >
              Buscar
            </NavLink>
            {mainNav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onNavigate={close}
                className="hover:bg-secondary rounded-lg px-3 py-2.5 text-base"
              >
                {item.title}
              </NavLink>
            ))}

            <p className="text-muted-foreground px-3 pt-4 pb-1 text-xs font-semibold tracking-wide uppercase">
              Ayuda
            </p>
            {helpNav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onNavigate={close}
                className="hover:bg-secondary rounded-lg px-3 py-2.5 text-base"
              >
                {item.title}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            <Button asChild variant="outline" onClick={close}>
              <Link href={ctaNav.reportFound.href}>
                {ctaNav.reportFound.title}
              </Link>
            </Button>
            <Button asChild variant="warm" onClick={close}>
              <Link href={ctaNav.reportLost.href}>
                {ctaNav.reportLost.title}
              </Link>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
